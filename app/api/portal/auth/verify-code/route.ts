import { audit, createSession, hmacHex, json, normalizeEmail, portalEnv, sessionCookie, timingSafeEqual } from "@/app/portal/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; code?: unknown }; const email = normalizeEmail(body.email); const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || !/^\d{6}$/.test(code) || !portalEnv.SESSION_SECRET) return json({ error: "Enter the six-digit code from your email." }, 400);
    const user = await portalEnv.DB.prepare("SELECT id FROM users WHERE email=? LIMIT 1").bind(email).first<{ id: string }>(); if (!user) return json({ error: "The code is invalid or expired." }, 400);
    const record = await portalEnv.DB.prepare("SELECT id,code_hash AS codeHash,expires_at AS expiresAt,attempts FROM login_codes WHERE user_id=? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1").bind(user.id).first<{ id: string; codeHash: string; expiresAt: number; attempts: number }>();
    if (!record || record.expiresAt < Date.now() || record.attempts >= 6) return json({ error: "The code is invalid or expired." }, 400);
    const supplied = await hmacHex(`${user.id}:${code}`, portalEnv.SESSION_SECRET); if (!timingSafeEqual(supplied, record.codeHash)) { await portalEnv.DB.prepare("UPDATE login_codes SET attempts=attempts+1 WHERE id=?").bind(record.id).run(); return json({ error: "The code is invalid or expired." }, 400); }
    const now = Date.now(); await portalEnv.DB.batch([portalEnv.DB.prepare("UPDATE login_codes SET consumed_at=? WHERE id=?").bind(now, record.id), portalEnv.DB.prepare("UPDATE users SET email_verified_at=?,updated_at=? WHERE id=?").bind(now, now, user.id)]);
    const token = await createSession(user.id); await audit("session_created", "user", user.id, user.id);
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(token) });
  } catch { return json({ error: "Unable to verify the sign-in code." }, 500); }
}
