import { appointmentEmail, sendPortalEmail } from "@/app/portal/email";
import { audit, createNotification, json, portalEnv, randomId, requireSession } from "@/app/portal/server";
import { CalendlyApiError, calendlyErrorCode, ensureCalendlyWebhook, findCalendlyBookingForEmail, scheduleCalendlyInvitee } from "@/app/portal/calendly";

type Appointment = { id: string; publicId: string; status: string; requestedStart: number; durationMinutes: number; timezone: string; applicantNote: string; confirmedStart: number | null; meetingUrl: string | null; adminNote: string; provider: string; providerBookingUrl: string | null; cancelUrl: string | null; rescheduleUrl: string | null; completedAt: number | null; createdAt: number; updatedAt: number };

async function current(userId: string) {
  return portalEnv.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.status,ar.requested_start AS requestedStart,ar.duration_minutes AS durationMinutes,ar.timezone,ar.applicant_note AS applicantNote,ar.confirmed_start AS confirmedStart,ar.meeting_url AS meetingUrl,ar.admin_note AS adminNote,ar.provider,ar.provider_booking_url AS providerBookingUrl,ar.cancel_url AS cancelUrl,ar.reschedule_url AS rescheduleUrl,ar.completed_at AS completedAt,ar.created_at AS createdAt,ar.updated_at AS updatedAt FROM appointment_requests ar WHERE ar.user_id=? ORDER BY ar.created_at DESC LIMIT 1`).bind(userId).first<Appointment>();
}

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const appointment = await current(session.user.id);
  if (appointment?.providerBookingUrl) await ensureCalendlyWebhook().catch(async () => audit("calendly_webhook_ensure_failed", "appointment", appointment.id, session.user!.id, { publicId: appointment.publicId }));
  return json({ appointment });
}

export async function POST(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT id,public_id AS publicId,review_status AS reviewStatus,answers_json AS answersJson FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; publicId: string; reviewStatus: string; answersJson: string }>();
  if (!application || application.reviewStatus !== "completed") return json({ error: "Your review must be completed before requesting a call." }, 409);
  const body = await request.json() as { requestedStart?: unknown; durationMinutes?: unknown; timezone?: unknown; note?: unknown; bookingMode?: unknown; bookingToken?: unknown };
  const requestedStart = Number(body.requestedStart); const durationMinutes = Number(body.durationMinutes); const timezone = typeof body.timezone === "string" ? body.timezone.trim().slice(0, 80) : ""; const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : ""; const now = Date.now();
  if (!Number.isInteger(requestedStart) || requestedStart < now + 3600000 || requestedStart > now + 180 * 86400000) return json({ error: "Choose a future call time within the next 180 days." }, 400);
  if (![30, 45, 60].includes(durationMinutes)) return json({ error: "Choose a call length of 30, 45 or 60 minutes." }, 400);
  if (!timezone) return json({ error: "Your timezone is required." }, 400);
  const existing = await current(session.user.id); if (existing && !["requested", "cancelled"].includes(existing.status)) return json({ error: "This appointment is already being managed by Migrz." }, 409);
  const appointmentId = existing?.id || randomId("apt_"); const publicId = existing?.publicId || `CALL-${new Date().getUTCFullYear()}-${randomId().slice(0, 8).toUpperCase()}`;
  const useCalendly = body.bookingMode === "calendly" && Boolean(portalEnv.CALENDLY_API_TOKEN);
  let booking: Awaited<ReturnType<typeof scheduleCalendlyInvitee>> | null = null;
  let providerBookingUrl: string | null = null;
  if (useCalendly) {
    const answers = JSON.parse(application.answersJson || "{}") as { fullName?: string };
    const bookingToken = typeof body.bookingToken === "string" ? body.bookingToken : undefined;
    try { booking = await scheduleCalendlyInvitee({ startTime: new Date(requestedStart).toISOString(), email: session.user.email, name: answers.fullName || session.user.email, timezone, userId: session.user.id, bookingToken, trackingId: application.publicId }); }
    catch (error) {
      const providerCode = calendlyErrorCode(error);
      console.error("Calendly booking failed", { providerCode, applicationId: application.id });
      await audit("appointment_booking_failed", "application", application.id, session.user.id, { publicId: application.publicId, providerCode });
      if (providerCode === "booking_token_invalid") return json({ error: "That availability list expired. Refreshing the live times now.", refreshSlots: true }, 409);
      if (error instanceof CalendlyApiError) providerBookingUrl = error.hostedBookingUrl || null;
    }
  }
  const status = booking ? "confirmed" : "requested"; const confirmedStart = booking ? new Date(booking.startTime).getTime() : null;
  if (existing) await portalEnv.DB.prepare("UPDATE appointment_requests SET requested_start=?,duration_minutes=?,timezone=?,applicant_note=?,status=?,confirmed_start=?,meeting_url=?,provider=?,provider_event_uri=?,provider_invitee_uri=?,provider_booking_url=?,cancel_url=?,reschedule_url=?,completed_at=NULL,completion_notification_sent_at=NULL,completion_notification_attempts=0,updated_at=? WHERE id=?").bind(requestedStart, durationMinutes, timezone, note, status, confirmedStart, booking?.meetingUrl || null, booking ? "calendly" : providerBookingUrl ? "calendly_hosted" : "manual", booking?.eventUri || null, booking?.inviteeUri || null, providerBookingUrl, booking?.cancelUrl || null, booking?.rescheduleUrl || null, now, appointmentId).run();
  else await portalEnv.DB.prepare("INSERT INTO appointment_requests (id,public_id,application_id,user_id,requested_start,duration_minutes,timezone,applicant_note,status,confirmed_start,meeting_url,provider,provider_event_uri,provider_invitee_uri,provider_booking_url,cancel_url,reschedule_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(appointmentId, publicId, application.id, session.user.id, requestedStart, durationMinutes, timezone, note, status, confirmedStart, booking?.meetingUrl || null, booking ? "calendly" : providerBookingUrl ? "calendly_hosted" : "manual", booking?.eventUri || null, booking?.inviteeUri || null, providerBookingUrl, booking?.cancelUrl || null, booking?.rescheduleUrl || null, now, now).run();
  await audit(booking ? "appointment_booked" : "appointment_requested", "appointment", appointmentId, session.user.id, { publicId, applicationPublicId: application.publicId, requestedStart, durationMinutes, timezone, provider: booking ? "calendly" : "manual" });
  const when = new Date(confirmedStart || requestedStart).toISOString(); const applicantMessage = appointmentEmail(application.publicId, booking ? "Your Migrz assessment call is confirmed" : "Your Migrz call request was received", booking ? `Confirmed time: ${when}. Duration: ${durationMinutes} minutes. Your portal will show the join link as soon as the meeting provider makes it available.` : `Requested time: ${when}. Duration: ${durationMinutes} minutes. Migrz will confirm the final time in your portal and by email.`);
  try { await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, session.user.email, applicantMessage.subject, applicantMessage.text, applicantMessage.html); } catch { /* The saved request remains authoritative. */ }
  try { const adminMessage = appointmentEmail(application.publicId, "New assessment call request", `${session.user.email} requested ${when} for ${durationMinutes} minutes (${timezone}).`); await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, "control@migrzz.com", adminMessage.subject, adminMessage.text, adminMessage.html); } catch { /* Admin can still see the request in operations. */ }
  return json({ ok: true, appointment: await current(session.user.id), bookingFallback: Boolean(useCalendly && !booking), hostedBooking: Boolean(providerBookingUrl) }, existing ? 200 : 201);
}

export async function PATCH(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { action?: unknown }; if (body.action !== "reconcile_calendly") return json({ error: "Unsupported appointment action." }, 400);
  const appointment = await current(session.user.id); if (!appointment?.providerBookingUrl) return json({ error: "There is no pending Calendly booking to check." }, 409);
  try {
    const booking = await findCalendlyBookingForEmail(session.user.email, appointment.requestedStart); if (!booking) return json({ error: "We could not find a completed Calendly booking yet. Finish the booking, then check again." }, 404);
    const confirmed = new Date(booking.startTime).getTime(); const now = Date.now();
    await portalEnv.DB.prepare("UPDATE appointment_requests SET status='confirmed',provider='calendly',confirmed_start=?,meeting_url=?,provider_event_uri=?,provider_invitee_uri=?,provider_booking_url=NULL,cancel_url=?,reschedule_url=?,updated_at=? WHERE id=?").bind(confirmed, booking.meetingUrl, booking.eventUri, booking.inviteeUri, booking.cancelUrl, booking.rescheduleUrl, now, appointment.id).run();
    await createNotification(session.user.id, "call_confirmed", "Your review call is confirmed", "Your Calendly booking has been matched to your Migrz account.", "View call details", "appointment", "appointment", appointment.id);
    await audit("calendly_booking_reconciled", "appointment", appointment.id, session.user.id, { publicId: appointment.publicId, confirmedStart: confirmed });
    return json({ ok: true, appointment: await current(session.user.id) });
  } catch { return json({ error: "Calendly could not be checked right now. Your Calendly booking remains valid; try this check again shortly." }, 502); }
}
