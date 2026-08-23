import { appointmentEmail, sendPortalEmail } from "@/app/portal/email";
import { audit, json, portalEnv, randomId, requireSession } from "@/app/portal/server";

type Appointment = { id: string; publicId: string; status: string; requestedStart: number; durationMinutes: number; timezone: string; applicantNote: string; confirmedStart: number | null; meetingUrl: string | null; adminNote: string; createdAt: number; updatedAt: number };

async function current(userId: string) {
  return portalEnv.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.status,ar.requested_start AS requestedStart,ar.duration_minutes AS durationMinutes,ar.timezone,ar.applicant_note AS applicantNote,ar.confirmed_start AS confirmedStart,ar.meeting_url AS meetingUrl,ar.admin_note AS adminNote,ar.created_at AS createdAt,ar.updated_at AS updatedAt FROM appointment_requests ar WHERE ar.user_id=? ORDER BY ar.created_at DESC LIMIT 1`).bind(userId).first<Appointment>();
}

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  return json({ appointment: await current(session.user.id) });
}

export async function POST(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT id,public_id AS publicId,review_status AS reviewStatus FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; publicId: string; reviewStatus: string }>();
  if (!application || application.reviewStatus !== "completed") return json({ error: "Your review must be completed before requesting a call." }, 409);
  const body = await request.json() as { requestedStart?: unknown; durationMinutes?: unknown; timezone?: unknown; note?: unknown };
  const requestedStart = Number(body.requestedStart); const durationMinutes = Number(body.durationMinutes); const timezone = typeof body.timezone === "string" ? body.timezone.trim().slice(0, 80) : ""; const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : ""; const now = Date.now();
  if (!Number.isInteger(requestedStart) || requestedStart < now + 3600000 || requestedStart > now + 180 * 86400000) return json({ error: "Choose a future call time within the next 180 days." }, 400);
  if (![30, 45, 60].includes(durationMinutes)) return json({ error: "Choose a call length of 30, 45 or 60 minutes." }, 400);
  if (!timezone) return json({ error: "Your timezone is required." }, 400);
  const existing = await current(session.user.id); if (existing && !["requested", "cancelled"].includes(existing.status)) return json({ error: "This appointment is already being managed by Migrz." }, 409);
  const appointmentId = existing?.id || randomId("apt_"); const publicId = existing?.publicId || `CALL-${new Date().getUTCFullYear()}-${randomId().slice(0, 8).toUpperCase()}`;
  if (existing) await portalEnv.DB.prepare("UPDATE appointment_requests SET requested_start=?,duration_minutes=?,timezone=?,applicant_note=?,status='requested',confirmed_start=NULL,meeting_url=NULL,updated_at=? WHERE id=?").bind(requestedStart, durationMinutes, timezone, note, now, appointmentId).run();
  else await portalEnv.DB.prepare("INSERT INTO appointment_requests (id,public_id,application_id,user_id,requested_start,duration_minutes,timezone,applicant_note,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(appointmentId, publicId, application.id, session.user.id, requestedStart, durationMinutes, timezone, note, "requested", now, now).run();
  await audit("appointment_requested", "appointment", appointmentId, session.user.id, { publicId, applicationPublicId: application.publicId, requestedStart, durationMinutes, timezone });
  const when = new Date(requestedStart).toISOString(); const applicantMessage = appointmentEmail(application.publicId, "Your Migrz call request was received", `Requested time: ${when}. Duration: ${durationMinutes} minutes. Migrz will confirm the final time in your portal and by email.`);
  try { await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, session.user.email, applicantMessage.subject, applicantMessage.text, applicantMessage.html); } catch { /* The saved request remains authoritative. */ }
  try { const adminMessage = appointmentEmail(application.publicId, "New assessment call request", `${session.user.email} requested ${when} for ${durationMinutes} minutes (${timezone}).`); await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, "control@migrzz.com", adminMessage.subject, adminMessage.text, adminMessage.html); } catch { /* Admin can still see the request in operations. */ }
  return json({ ok: true, appointment: await current(session.user.id) }, existing ? 200 : 201);
}
