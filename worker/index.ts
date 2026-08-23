/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { callCompletedEmail, reviewCompletedEmail, sendPortalEmail } from "../app/portal/email";

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
    ctx.waitUntil(Promise.all([processReviewNotificationQueue(env), processCallCompletionNotificationQueue(env)]));
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

export default worker;
