import { audit, clientIpHash, json, portalEnv, randomId, requireSession, sha256 } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireSession(request); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT id,public_id AS publicId FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; publicId: string }>();
  const [user, requests, feedback, timeline, sessions] = await Promise.all([
    portalEnv.DB.prepare("SELECT notification_email AS notificationEmail,notification_appointments AS notificationAppointments,privacy_requested_at AS privacyRequestedAt,deletion_requested_at AS deletionRequestedAt,created_at AS createdAt,last_login_at AS lastLoginAt FROM users WHERE id=?").bind(session.user.id).first(),
    portalEnv.DB.prepare("SELECT id,request_type AS requestType,status,requested_at AS requestedAt,completed_at AS completedAt FROM user_data_requests WHERE user_id=? ORDER BY requested_at DESC").bind(session.user.id).all(),
    application ? portalEnv.DB.prepare("SELECT stage,rating,comment,created_at AS createdAt FROM service_feedback WHERE application_id=? ORDER BY created_at DESC").bind(application.id).all() : Promise.resolve({ results: [] }),
    application ? portalEnv.DB.prepare("SELECT event,entity_type AS entityType,metadata_json AS metadataJson,created_at AS createdAt FROM audit_events WHERE actor_user_id=? OR entity_id=? ORDER BY created_at DESC LIMIT 100").bind(session.user.id, application.id).all() : portalEnv.DB.prepare("SELECT event,entity_type AS entityType,metadata_json AS metadataJson,created_at AS createdAt FROM audit_events WHERE actor_user_id=? ORDER BY created_at DESC LIMIT 100").bind(session.user.id).all(),
    portalEnv.DB.prepare("SELECT id,created_at AS createdAt,expires_at AS expiresAt,revoked_at AS revokedAt FROM sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 20").bind(session.user.id).all(),
  ]);
  return json({ user, requests: requests.results, feedback: feedback.results, timeline: timeline.results, sessions: sessions.results, application });
}

export async function PATCH(request: Request) {
  const session = await requireSession(request); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { notificationEmail?: unknown; notificationAppointments?: unknown; revokeOtherSessions?: unknown };
  const now = Date.now();
  if (body.revokeOtherSessions === true) {
    const cookie = request.headers.get("cookie") || ""; const token = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("migrz_session="))?.split("=").slice(1).join("=") || ""; const tokenHash = token ? await sha256(decodeURIComponent(token)) : "";
    await portalEnv.DB.prepare("UPDATE sessions SET revoked_at=? WHERE user_id=? AND token_hash!=? AND revoked_at IS NULL").bind(now, session.user.id, tokenHash).run(); await audit("other_sessions_revoked", "user", session.user.id, session.user.id); return json({ ok: true });
  }
  const email = body.notificationEmail === false ? 0 : 1; const appointments = body.notificationAppointments === false ? 0 : 1;
  await portalEnv.DB.prepare("UPDATE users SET notification_email=?,notification_appointments=?,updated_at=? WHERE id=?").bind(email, appointments, now, session.user.id).run();
  await audit("notification_preferences_updated", "user", session.user.id, session.user.id, { email: Boolean(email), appointments: Boolean(appointments) }); return json({ ok: true });
}

export async function POST(request: Request) {
  const session = await requireSession(request); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { action?: unknown; stage?: unknown; rating?: unknown; comment?: unknown; granted?: unknown; documentVersion?: unknown };
  const action = typeof body.action === "string" ? body.action : ""; const now = Date.now();
  const application = await portalEnv.DB.prepare("SELECT id,public_id AS publicId FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; publicId: string }>();
  if (action === "feedback") {
    if (!application) return json({ error: "Application not found." }, 404); const rating = Number(body.rating); const stage = typeof body.stage === "string" && ["report", "call", "service"].includes(body.stage) ? body.stage : "service"; const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : ""; if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Choose a rating from 1 to 5." }, 400);
    await portalEnv.DB.prepare("INSERT INTO service_feedback (id,application_id,user_id,stage,rating,comment,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(application_id,stage) DO UPDATE SET rating=excluded.rating,comment=excluded.comment,created_at=excluded.created_at").bind(randomId("fb_"), application.id, session.user.id, stage, rating, comment, now).run(); await audit("service_feedback_recorded", "application", application.id, session.user.id, { stage, rating }); return json({ ok: true }, 201);
  }
  if (action === "export" || action === "deletion") {
    const existing = await portalEnv.DB.prepare("SELECT id FROM user_data_requests WHERE user_id=? AND request_type=? AND status IN ('requested','processing') LIMIT 1").bind(session.user.id, action).first(); if (existing) return json({ error: "This request is already being processed." }, 409);
    const id = randomId("dsr_"); await portalEnv.DB.prepare("INSERT INTO user_data_requests (id,user_id,request_type,status,requested_at) VALUES (?,?,?,?,?)").bind(id, session.user.id, action, "requested", now).run(); if (action === "deletion") await portalEnv.DB.prepare("UPDATE users SET deletion_requested_at=? WHERE id=?").bind(now, session.user.id).run(); else await portalEnv.DB.prepare("UPDATE users SET privacy_requested_at=? WHERE id=?").bind(now, session.user.id).run(); await audit(`user_${action}_requested`, "user", session.user.id, session.user.id, { requestId: id }); return json({ ok: true, id }, 201);
  }
  if (action === "consent") {
    const version = typeof body.documentVersion === "string" ? body.documentVersion.slice(0, 40) : "2026-08-24"; const ua = request.headers.get("user-agent") || ""; await portalEnv.DB.prepare("INSERT INTO consent_records (id,user_id,consent_type,document_version,granted,ip_hash,user_agent_hash,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(randomId("con_"), session.user.id, "terms_privacy", version, body.granted === false ? 0 : 1, await clientIpHash(request), await sha256(ua), now).run(); return json({ ok: true }, 201);
  }
  return json({ error: "Unsupported account action." }, 400);
}
