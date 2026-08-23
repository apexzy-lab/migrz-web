/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { appointmentEmail, callCompletedEmail, reviewCompletedEmail, sendPortalEmail, serviceUpdateEmail } from "../app/portal/email";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  ZEPTOMAIL_TOKEN?: string;
  ZEPTOMAIL_FROM?: string;
  ZEPTOMAIL_FROM_NAME?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "apply.migrzz.com" && url.pathname === "/") {
      url.pathname = "/portal";
      request = new Request(url.toString(), request);
    }

    if (url.hostname === "migrzz.com" && url.pathname === "/portal") {
      return Response.redirect("https://apply.migrzz.com/", 302);
    }

    if (url.hostname === "migrzz.com" && url.pathname.startsWith("/admin")) {
      return Response.redirect(`https://apply.migrzz.com${url.pathname}${url.search}`, 302);
    }

    // Keep one canonical hostname after the WordPress-to-Worker cutover.
    if (url.hostname === "www.migrzz.com") {
      url.hostname = "migrzz.com";
      return Response.redirect(url.toString(), 301);
    }

    // Preserve the indexed WordPress local-business artifact with its closest
    // useful replacement instead of returning a 404 after the cutover.
    if (url.pathname === "/locations.kml") {
      url.pathname = "/about";
      url.search = "";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.all([processReviewNotificationQueue(env), processCallCompletionNotificationQueue(env), processAppointmentReminders(env), processNoShowFollowups(env), processSlaAlerts(env)]));
  },
};

async function processReviewNotificationQueue(env: Env) {
  if (!env.ZEPTOMAIL_TOKEN) return;
  const pending = await env.DB.prepare(`SELECT a.id,a.public_id AS publicId,a.answers_json AS answersJson,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.review_status='completed' AND a.review_notification_sent_at IS NULL AND a.review_notification_attempts<10 ORDER BY a.admin_updated_at ASC LIMIT 20`).all<{ id: string; publicId: string; answersJson: string; email: string }>();
  for (const application of pending.results) {
    const claim = await env.DB.prepare("UPDATE applications SET review_notification_sent_at=-1 WHERE id=? AND review_notification_sent_at IS NULL").bind(application.id).run(); if (!claim.meta.changes) continue;
    const answers = JSON.parse(application.answersJson || "{}") as { fullName?: string }; const message = reviewCompletedEmail(application.publicId, answers.fullName || "");
    try { await sendPortalEmail({ token: env.ZEPTOMAIL_TOKEN, from: env.ZEPTOMAIL_FROM, fromName: env.ZEPTOMAIL_FROM_NAME }, application.email, message.subject, message.text, message.html); await env.DB.prepare("UPDATE applications SET review_notification_sent_at=?,review_notification_attempts=review_notification_attempts+1 WHERE id=? AND review_notification_sent_at=-1").bind(Date.now(), application.id).run(); }
    catch { await env.DB.prepare("UPDATE applications SET review_notification_sent_at=NULL,review_notification_attempts=review_notification_attempts+1 WHERE id=?").bind(application.id).run(); }
  }
}

async function processCallCompletionNotificationQueue(env: Env) {
  if (!env.ZEPTOMAIL_TOKEN) return;
  const pending = await env.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.admin_note AS adminNote,a.public_id AS applicationPublicId,u.email FROM appointment_requests ar JOIN applications a ON a.id=ar.application_id JOIN users u ON u.id=ar.user_id WHERE ar.status='completed' AND ar.completion_notification_sent_at IS NULL AND ar.completion_notification_attempts<10 ORDER BY ar.completed_at ASC LIMIT 20`).all<{ id: string; publicId: string; adminNote: string; applicationPublicId: string; email: string }>();
  for (const appointment of pending.results) {
    const claim = await env.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=-1 WHERE id=? AND completion_notification_sent_at IS NULL").bind(appointment.id).run(); if (!claim.meta.changes) continue;
    const message = callCompletedEmail(appointment.applicationPublicId, appointment.publicId, appointment.adminNote);
    try { await sendPortalEmail({ token: env.ZEPTOMAIL_TOKEN, from: env.ZEPTOMAIL_FROM, fromName: env.ZEPTOMAIL_FROM_NAME }, appointment.email, message.subject, message.text, message.html); await env.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=?,completion_notification_attempts=completion_notification_attempts+1 WHERE id=? AND completion_notification_sent_at=-1").bind(Date.now(), appointment.id).run(); }
    catch { await env.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=NULL,completion_notification_attempts=completion_notification_attempts+1 WHERE id=?").bind(appointment.id).run(); }
  }
}

async function createWorkerNotification(env: Env, userId: string, type: string, title: string, message: string, actionLabel: string, actionView: string, entityId: string) {
  await env.DB.prepare("INSERT INTO notifications (id,user_id,type,title,message,action_label,action_view,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(`ntf_${crypto.randomUUID()}`, userId, type, title, message, actionLabel, actionView, "appointment", entityId, Date.now()).run();
}

async function processAppointmentReminders(env: Env) {
  if (!env.ZEPTOMAIL_TOKEN) return; const now = Date.now();
  const rows = await env.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.user_id AS userId,ar.confirmed_start AS confirmedStart,ar.duration_minutes AS durationMinutes,ar.timezone,ar.meeting_url AS meetingUrl,ar.reminder_24h_sent_at AS reminder24hSentAt,ar.reminder_1h_sent_at AS reminder1hSentAt,u.email FROM appointment_requests ar JOIN users u ON u.id=ar.user_id WHERE ar.status IN ('confirmed','rescheduled') AND ar.confirmed_start>? AND ar.confirmed_start<=? AND (ar.reminder_24h_sent_at IS NULL OR (ar.confirmed_start<=? AND ar.reminder_1h_sent_at IS NULL)) LIMIT 40`).bind(now, now + 25 * 3600000, now + 70 * 60000).all<{ id: string; publicId: string; userId: string; confirmedStart: number; durationMinutes: number; timezone: string; meetingUrl: string | null; reminder24hSentAt: number | null; reminder1hSentAt: number | null; email: string }>();
  for (const item of rows.results) {
    const oneHour = item.confirmedStart <= now + 70 * 60000; const column = oneHour ? "reminder_1h_sent_at" : "reminder_24h_sent_at"; const current = oneHour ? item.reminder1hSentAt : item.reminder24hSentAt; if (current) continue;
    const claim = await env.DB.prepare(`UPDATE appointment_requests SET ${column}=-1 WHERE id=? AND ${column} IS NULL`).bind(item.id).run(); if (!claim.meta.changes) continue;
    const when = new Date(item.confirmedStart).toLocaleString("en", { dateStyle: "full", timeStyle: "short", timeZone: item.timezone }); const heading = oneHour ? "Your Migrz call starts in about one hour" : "Your Migrz call is tomorrow"; const detail = `${when} (${item.timezone}) · ${item.durationMinutes} minutes.${item.meetingUrl ? " Your secure portal contains the join link." : ""}`; const email = appointmentEmail(item.publicId, heading, detail);
    try { await sendPortalEmail({ token: env.ZEPTOMAIL_TOKEN, from: env.ZEPTOMAIL_FROM, fromName: env.ZEPTOMAIL_FROM_NAME }, item.email, email.subject, email.text, email.html); await env.DB.prepare(`UPDATE appointment_requests SET ${column}=? WHERE id=? AND ${column}=-1`).bind(Date.now(), item.id).run(); await createWorkerNotification(env, item.userId, oneHour ? "call_reminder_1h" : "call_reminder_24h", heading, detail, "View call details", "appointment", item.id); }
    catch { await env.DB.prepare(`UPDATE appointment_requests SET ${column}=NULL WHERE id=?`).bind(item.id).run(); }
  }
}

async function processNoShowFollowups(env: Env) {
  if (!env.ZEPTOMAIL_TOKEN) return; const rows = await env.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.user_id AS userId,u.email FROM appointment_requests ar JOIN users u ON u.id=ar.user_id WHERE ar.status='no_show' AND ar.no_show_followup_sent_at IS NULL LIMIT 20`).all<{ id: string; publicId: string; userId: string; email: string }>();
  for (const item of rows.results) { const claim = await env.DB.prepare("UPDATE appointment_requests SET no_show_followup_sent_at=-1 WHERE id=? AND no_show_followup_sent_at IS NULL").bind(item.id).run(); if (!claim.meta.changes) continue; const email = serviceUpdateEmail(`Let’s reschedule your Migrz call — ${item.publicId}`, "We missed you at your review call", "Use your secure portal to choose another suitable time. If a technical issue prevented you from joining, send the team a private message.", "Reschedule your call");
    try { await sendPortalEmail({ token: env.ZEPTOMAIL_TOKEN, from: env.ZEPTOMAIL_FROM, fromName: env.ZEPTOMAIL_FROM_NAME }, item.email, email.subject, email.text, email.html); await env.DB.prepare("UPDATE appointment_requests SET no_show_followup_sent_at=? WHERE id=?").bind(Date.now(), item.id).run(); await createWorkerNotification(env, item.userId, "call_no_show", "Let’s reschedule your review call", "Choose another suitable time or message the Migrz team if you had a technical issue.", "Reschedule call", "appointment", item.id); }
    catch { await env.DB.prepare("UPDATE appointment_requests SET no_show_followup_sent_at=NULL WHERE id=?").bind(item.id).run(); }
  }
}

async function processSlaAlerts(env: Env) {
  const now = Date.now(); const rows = await env.DB.prepare(`SELECT id,user_id AS userId,public_id AS publicId FROM applications WHERE review_due_at IS NOT NULL AND review_due_at<? AND review_status IN ('submitted','in_review') AND NOT EXISTS (SELECT 1 FROM audit_events ae WHERE ae.entity_id=applications.id AND ae.event='review_sla_overdue_alerted') LIMIT 30`).bind(now).all<{ id: string; userId: string; publicId: string }>();
  for (const item of rows.results) { await env.DB.batch([env.DB.prepare("INSERT INTO audit_events (id,event,actor_user_id,entity_type,entity_id,metadata_json,created_at) VALUES (?,?,?,?,?,?,?)").bind(`evt_${crypto.randomUUID()}`, "review_sla_overdue_alerted", null, "application", item.id, JSON.stringify({ publicId: item.publicId }), now), env.DB.prepare("INSERT INTO notifications (id,user_id,type,title,message,action_label,action_view,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(`ntf_${crypto.randomUUID()}`, item.userId, "review_delay", "Your assessment review is taking longer than targeted", "Your record remains active with the Migrz team. We will update you as soon as the review is ready.", "View status", "home", "application", item.id, now)]); }
}

export default worker;
