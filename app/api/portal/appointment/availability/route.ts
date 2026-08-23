import { calendlyAvailableTimes } from "@/app/portal/calendly";
import { json, portalEnv, requireSession } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT review_status AS reviewStatus FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ reviewStatus: string }>();
  if (application?.reviewStatus !== "completed") return json({ error: "Your review must be completed before booking a call." }, 409);
  if (!portalEnv.CALENDLY_API_TOKEN || !portalEnv.CALENDLY_EVENT_TYPE_URI) return json({ configured: false, slots: [] });
  const url = new URL(request.url); const start = new Date(url.searchParams.get("start") || Date.now() + 3600000); const end = new Date(url.searchParams.get("end") || Date.now() + 14 * 86400000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 31 * 86400000) return json({ error: "Choose an availability range of 31 days or less." }, 400);
  try { return json({ configured: true, slots: await calendlyAvailableTimes(start.toISOString(), end.toISOString()) }); }
  catch { return json({ error: "Live availability is temporarily unavailable. You can still request a preferred time." }, 502); }
}
