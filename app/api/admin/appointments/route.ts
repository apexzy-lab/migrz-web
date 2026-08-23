import { appointmentEmail, callCompletedEmail, sendPortalEmail } from "@/app/portal/email";
import { calendlyErrorCode, scheduleCalendlyInvitee } from "@/app/portal/calendly";
import { audit, createNotification, json, portalEnv, requireAdmin } from "@/app/portal/server";

const statuses = ["requested", "confirmed", "rescheduled", "completed", "cancelled", "no_show"];

export async function PATCH(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { id?: unknown; action?: unknown; status?: unknown; confirmedStart?: unknown; meetingUrl?: unknown; adminNote?: unknown };
  const id = typeof body.id === "string" ? body.id : ""; const action = typeof body.action === "string" ? body.action : ""; const status = typeof body.status === "string" ? body.status : ""; if (!id) return json({ error: "Invalid appointment update." }, 400);
  const record = await portalEnv.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.status,ar.requested_start AS requestedStart,ar.duration_minutes AS durationMinutes,ar.timezone,ar.confirmed_start AS confirmedStart,ar.provider_event_uri AS providerEventUri,ar.completion_notification_sent_at AS completionNotificationSentAt,a.public_id AS applicationPublicId,a.answers_json AS answersJson,u.id AS userId,u.email FROM appointment_requests ar JOIN applications a ON a.id=ar.application_id JOIN users u ON u.id=ar.user_id WHERE ar.id=? LIMIT 1`).bind(id).first<{ id: string; publicId: string; status: string; requestedStart: number; durationMinutes: number; timezone: string; confirmedStart: number | null; providerEventUri: string | null; completionNotificationSentAt: number | null; applicationPublicId: string; answersJson: string; userId: string; email: string }>();
  if (!record) return json({ error: "Appointment not found." }, 404);
  const shouldSyncCalendly = action === "sync_calendly" || (status === "confirmed" && !record.providerEventUri && !(typeof body.meetingUrl === "string" && body.meetingUrl.trim()));
  if (shouldSyncCalendly) {
    if (record.providerEventUri) return json({ error: "This appointment is already connected to Calendly." }, 409);
    try {
      const answers = JSON.parse(record.answersJson || "{}") as { fullName?: string };
      const booking = await scheduleCalendlyInvitee({ startTime: new Date(record.requestedStart).toISOString(), email: record.email, name: answers.fullName || record.email, timezone: record.timezone, userId: record.userId });
      const confirmed = new Date(booking.startTime).getTime(); const now = Date.now();
      await portalEnv.DB.prepare("UPDATE appointment_requests SET status='confirmed',confirmed_start=?,meeting_url=?,provider='calendly',provider_event_uri=?,provider_invitee_uri=?,cancel_url=?,reschedule_url=?,updated_at=? WHERE id=?").bind(confirmed, booking.meetingUrl || null, booking.eventUri, booking.inviteeUri, booking.cancelUrl, booking.rescheduleUrl, now, id).run();
      await createNotification(record.userId, "call_confirmed", "Your review call is confirmed", "Your Calendly booking and joining details are now available in the appointment area.", "View call details", "appointment", "appointment", id);
      const message = appointmentEmail(record.applicationPublicId, "Your Migrz assessment call is confirmed", `Confirmed time: ${new Date(confirmed).toISOString()}. Duration: ${record.durationMinutes} minutes.${booking.meetingUrl ? ` Meeting link: ${booking.meetingUrl}` : " Joining details will appear in your portal."}`);
      try { await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, record.email, message.subject, message.text, message.html); } catch { /* Portal confirmation remains authoritative. */ }
      await audit("appointment_calendly_synced", "appointment", id, session.user.id, { publicId: record.publicId, confirmedStart: confirmed });
      return json({ ok: true, meetingUrl: booking.meetingUrl, status: "confirmed" });
    } catch (error) {
      const providerCode = calendlyErrorCode(error); await audit("appointment_calendly_sync_failed", "appointment", id, session.user.id, { publicId: record.publicId, providerCode });
      return json({ error: providerCode === "provider_429" ? "Calendly is still rate limiting bookings. Wait briefly and retry." : "Calendly could not create this meeting. Check the event type, account plan and token permissions, then retry.", providerCode }, 502);
    }
  }
  if (!statuses.includes(status)) return json({ error: "Invalid appointment update." }, 400);
  const confirmedStart = body.confirmedStart == null || body.confirmedStart === "" ? null : Number(body.confirmedStart); const meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl.trim().slice(0, 500) : ""; const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 1000) : "";
  if (status === "confirmed" && (!Number.isInteger(confirmedStart) || Number(confirmedStart) < Date.now())) return json({ error: "Choose a future confirmed time." }, 400);
  if (status === "completed" && !adminNote) return json({ error: "Add the applicant-facing outcome or next action before completing the call." }, 400);
  if (meetingUrl && !/^https:\/\//i.test(meetingUrl)) return json({ error: "Meeting links must use HTTPS." }, 400);
  const now = Date.now(); const timeChanged = confirmedStart !== record.confirmedStart;
  await portalEnv.DB.prepare("UPDATE appointment_requests SET status=?,confirmed_start=?,meeting_url=?,admin_note=?,completed_at=CASE WHEN ?='completed' THEN coalesce(completed_at,?) ELSE completed_at END,reminder_24h_sent_at=CASE WHEN ? THEN NULL ELSE reminder_24h_sent_at END,reminder_1h_sent_at=CASE WHEN ? THEN NULL ELSE reminder_1h_sent_at END,no_show_followup_sent_at=CASE WHEN ?!='no_show' THEN NULL ELSE no_show_followup_sent_at END,updated_at=? WHERE id=?").bind(status, confirmedStart, meetingUrl || null, adminNote, status, now, timeChanged ? 1 : 0, timeChanged ? 1 : 0, status, now, id).run();
  await audit("appointment_updated", "appointment", id, session.user.id, { publicId: record.publicId, status, confirmedStart, durationMinutes: record.durationMinutes });
  if (status === "confirmed" && confirmedStart && (record.status !== "confirmed" || record.confirmedStart !== confirmedStart)) { const message = appointmentEmail(record.applicationPublicId, "Your Migrz assessment call is confirmed", `Confirmed time: ${new Date(confirmedStart).toISOString()}. Duration: ${record.durationMinutes} minutes.${meetingUrl ? ` Meeting link: ${meetingUrl}` : " Call details are available in your portal."}`); try { await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, record.email, message.subject, message.text, message.html); } catch { return json({ ok: true, warning: "Appointment saved, but the confirmation email could not be sent." }); } }
  if (status === "completed" && record.status !== "completed" && !record.completionNotificationSentAt) {
    await createNotification(record.userId, "call_completed", "Your review call is complete", adminNote || "Your Migrz adviser is preparing your follow-up and agreed next steps.", "View next steps", "appointment", "appointment", record.id);
    const claim = await portalEnv.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=-1 WHERE id=? AND completion_notification_sent_at IS NULL").bind(id).run();
    if (claim.meta.changes) {
      const message = callCompletedEmail(record.applicationPublicId, record.publicId, adminNote);
      try { await sendPortalEmail({ token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME }, record.email, message.subject, message.text, message.html); await portalEnv.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=?,completion_notification_attempts=completion_notification_attempts+1 WHERE id=?").bind(Date.now(), id).run(); await audit("call_completion_email_sent", "appointment", id, session.user.id, { publicId: record.publicId }); }
      catch { await portalEnv.DB.prepare("UPDATE appointment_requests SET completion_notification_sent_at=NULL,completion_notification_attempts=completion_notification_attempts+1 WHERE id=?").bind(id).run(); await audit("call_completion_email_queued", "appointment", id, session.user.id, { publicId: record.publicId }); return json({ ok: true, warning: "Call marked complete. The portal notification is live and the email is queued for retry." }); }
    }
  }
  return json({ ok: true, notification: status === "completed" && record.status !== "completed" ? "sent" : "unchanged" });
}
