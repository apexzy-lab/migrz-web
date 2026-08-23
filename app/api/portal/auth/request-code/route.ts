import { audit, clientIpHash, hmacHex, integrationStatus, json, normalizeCountry, normalizeEmail, plans, portalEnv, randomCode, randomId, sendLoginCode, validPlan } from "@/app/portal/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; countryResidence?: unknown; plan?: unknown };
    const email = normalizeEmail(body.email); const country = normalizeCountry(body.countryResidence); const plan = body.plan;
    if (!email || !country || !validPlan(plan)) return json({ error: "Enter a valid email, country of residence and assessment plan." }, 400);
    if (!integrationStatus().email || !portalEnv.SESSION_SECRET) return json({ error: "Email sign-in is being configured. Please try again later." }, 503);
    const now = Date.now();
    let user = await portalEnv.DB.prepare("SELECT id FROM users WHERE email=? LIMIT 1").bind(email).first<{ id: string }>();
    if (!user) { user = { id: randomId("usr_") }; await portalEnv.DB.prepare("INSERT INTO users (id,email,country_residence,preferred_plan,created_at,updated_at) VALUES (?,?,?,?,?,?)").bind(user.id, email, country, plan, now, now).run(); }
    else await portalEnv.DB.prepare("UPDATE users SET country_residence=?,preferred_plan=?,updated_at=? WHERE id=?").bind(country, plan, now, user.id).run();
    const recent = await portalEnv.DB.prepare("SELECT COUNT(*) AS count FROM login_codes WHERE user_id=? AND created_at>?").bind(user.id, now - 10 * 60000).first<{ count: number }>();
    if ((recent?.count || 0) >= 5) return json({ error: "Too many codes requested. Wait 10 minutes and try again." }, 429);
    const code = randomCode(); const codeHash = await hmacHex(`${user.id}:${code}`, portalEnv.SESSION_SECRET); const codeId = randomId("otp_");
    await portalEnv.DB.prepare("INSERT INTO login_codes (id,user_id,code_hash,expires_at,attempts,ip_hash,created_at) VALUES (?,?,?,?,?,?,?)").bind(codeId, user.id, codeHash, now + 10 * 60000, 0, await clientIpHash(request), now).run();
    try { await sendLoginCode(email, code); } catch { await portalEnv.DB.prepare("DELETE FROM login_codes WHERE id=?").bind(codeId).run(); return json({ error: "We could not send the sign-in email. Please try again shortly." }, 503); }
    await audit("login_code_sent", "user", user.id, user.id, { country, plan: plans[plan].name });
    return json({ ok: true, expiresInSeconds: 600 });
  } catch { return json({ error: "Unable to request a sign-in code." }, 500); }
}
