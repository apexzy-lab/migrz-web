import { calendlyWebhookRequestIsValid } from "@/app/portal/calendly";
import { audit, createNotification, json, portalEnv } from "@/app/portal/server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!(await calendlyWebhookRequestIsValid(request, rawBody))) return json({ error: "Invalid signature" }, 401);
  const body = JSON.parse(rawBody) as { event?: string; payload?: { uri?: string; event?: string; email?: string; cancel_url?: string; reschedule_url?: string; status?: string; rescheduled?: boolean; old_invitee?: string; new_invitee?: string; tracking?: { utm_content?: string }; cancellation?: { reason?: string }; scheduled_event?: { uri?: string; start_time?: string; location?: { join_url?: string; location?: string } } } };
  const inviteeUri = body.payload?.uri || ""; if (!inviteeUri) return json({ ok: true });
  const lookupUri = body.event === "invitee.created" && body.payload?.old_invitee ? body.payload.old_invitee : inviteeUri;
  let record = await portalEnv.DB.prepare("SELECT id,user_id AS userId,status FROM appointment_requests WHERE provider_invitee_uri=? LIMIT 1").bind(lookupUri).first<{ id: string; userId: string; status: string }>();
  if (!record && body.event === "invitee.created" && body.payload?.tracking?.utm_content) record = await portalEnv.DB.prepare("SELECT ar.id,ar.user_id AS userId,ar.status FROM appointment_requests ar JOIN applications a ON a.id=ar.application_id WHERE a.public_id=? AND ar.provider_booking_url IS NOT NULL ORDER BY ar.created_at DESC LIMIT 1").bind(body.payload.tracking.utm_content).first<{ id: string; userId: string; status: string }>();
  if (!record && body.event === "invitee.created" && body.payload?.email) record = await portalEnv.DB.prepare("SELECT ar.id,ar.user_id AS userId,ar.status FROM appointment_requests ar JOIN users u ON u.id=ar.user_id WHERE lower(u.email)=lower(?) AND ar.provider_booking_url IS NOT NULL ORDER BY ar.created_at DESC LIMIT 1").bind(body.payload.email).first<{ id: string; userId: string; status: string }>();
  if (!record) return json({ ok: true });
  if (body.event === "invitee.created") {
    const scheduled = body.payload.scheduled_event; const confirmedStart = scheduled?.start_time ? new Date(scheduled.start_time).getTime() : null; const meetingUrl = scheduled?.location?.join_url || (scheduled?.location?.location?.startsWith("https://") ? scheduled.location.location : null);
    await portalEnv.DB.prepare("UPDATE appointment_requests SET status='confirmed',provider='calendly',provider_invitee_uri=?,provider_event_uri=?,provider_booking_url=NULL,cancel_url=coalesce(?,cancel_url),reschedule_url=coalesce(?,reschedule_url),confirmed_start=coalesce(?,confirmed_start),meeting_url=coalesce(?,meeting_url),updated_at=? WHERE id=?").bind(inviteeUri, scheduled?.uri || body.payload.event || null, body.payload.cancel_url || null, body.payload.reschedule_url || null, confirmedStart, meetingUrl, Date.now(), record.id).run();
    const rescheduled = Boolean(body.payload?.old_invitee);
    await createNotification(record.userId, rescheduled ? "call_rescheduled" : "call_confirmed", rescheduled ? "Your review call was rescheduled" : "Your review call is confirmed", rescheduled ? "Your updated date, time and joining details are available in the appointment area." : "Your Calendly booking and joining details are available in the appointment area.", "View call details", "appointment", "appointment", record.id);
    await audit(rescheduled ? "calendly_appointment_rescheduled" : "calendly_appointment_confirmed", "appointment", record.id, null, { confirmedStart, meetingUrlAvailable: Boolean(meetingUrl) });
  }
  if (body.event === "invitee.canceled" && !body.payload?.rescheduled && record.status !== "completed") {
    await portalEnv.DB.prepare("UPDATE appointment_requests SET status='cancelled',updated_at=? WHERE id=?").bind(Date.now(), record.id).run();
    await createNotification(record.userId, "call_cancelled", "Your review call was cancelled", "Open the appointment area when you are ready to arrange another suitable time.", "View appointment", "appointment", "appointment", record.id);
    await audit("calendly_appointment_cancelled", "appointment", record.id, null, { reason: body.payload?.cancellation?.reason || "" });
  }
  return json({ ok: true });
}
