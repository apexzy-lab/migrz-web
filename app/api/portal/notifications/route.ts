import { json, portalEnv, requireSession } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const records = await portalEnv.DB.prepare("SELECT id,type,title,message,action_label AS actionLabel,action_view AS actionView,entity_type AS entityType,entity_id AS entityId,read_at AS readAt,created_at AS createdAt FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(session.user.id).all();
  return json({ notifications: records.results, unread: records.results.filter((item) => !(item as { readAt?: number | null }).readAt).length });
}

export async function PATCH(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { id?: unknown; all?: unknown }; const now = Date.now();
  if (body.all === true) await portalEnv.DB.prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").bind(now, session.user.id).run();
  else if (typeof body.id === "string") await portalEnv.DB.prepare("UPDATE notifications SET read_at=? WHERE id=? AND user_id=? AND read_at IS NULL").bind(now, body.id, session.user.id).run();
  else return json({ error: "Choose a notification to mark as read." }, 400);
  return json({ ok: true });
}
