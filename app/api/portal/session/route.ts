import { clearSessionCookie, getSessionUser, integrationStatus, json, portalEnv, readCookie, SESSION_COOKIE, sha256 } from "@/app/portal/server";

export async function GET(request: Request) {
  try { const user = await getSessionUser(request); return json({ authenticated: Boolean(user), user: user ? { email: user.email, countryResidence: user.countryResidence, preferredPlan: user.preferredPlan, paid: Boolean(user.paid), paidPlan: user.paidPlan, admin: Boolean(user.admin) } : null, integrations: integrationStatus() }); }
  catch { return json({ authenticated: false, user: null, integrations: integrationStatus() }); }
}
export async function DELETE(request: Request) {
  const token = readCookie(request, SESSION_COOKIE); if (token) await portalEnv.DB.prepare("UPDATE sessions SET revoked_at=? WHERE token_hash=?").bind(Date.now(), await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
