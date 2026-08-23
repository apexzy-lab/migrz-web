import { env } from "cloudflare:workers";

export type PlanId = "standard" | "accelerated";
export type ProviderId = "paystack" | "paypal";

type PortalEnv = {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  SESSION_SECRET?: string;
  ZEPTOMAIL_TOKEN?: string;
  ZEPTOMAIL_FROM?: string;
  ZEPTOMAIL_FROM_NAME?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_CURRENCY?: string;
  PAYSTACK_STANDARD_AMOUNT_MINOR?: string;
  PAYSTACK_ACCELERATED_AMOUNT_MINOR?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_MODE?: string;
};

export const portalEnv = env as unknown as PortalEnv;
export const SESSION_COOKIE = "migrz_session";
export const plans: Record<PlanId, { name: string; usdMinor: number; delivery: string }> = {
  standard: { name: "Standard assessment", usdMinor: 35000, delivery: "Written report with a 48-hour target" },
  accelerated: { name: "Accelerated assessment", usdMinor: 55000, delivery: "Same business day before 12:00 PM WAT; otherwise next business day" },
};

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "cache-control": "no-store", ...headers } });
}

export function normalizeEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : "";
}

export function validPlan(value: unknown): value is PlanId { return value === "standard" || value === "accelerated"; }
export function normalizeCountry(value: unknown) {
  const country = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(country) ? country : "";
}
export function providerForCountry(country: string): ProviderId { return country === "NG" ? "paystack" : "paypal"; }

function bytesToHex(bytes: Uint8Array) { return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export function randomId(prefix = "") { const bytes = crypto.getRandomValues(new Uint8Array(18)); return `${prefix}${bytesToHex(bytes)}`; }
export function randomCode() { const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000; return value.toString().padStart(6, "0"); }
export async function sha256(value: string) { return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
export async function hmacHex(value: string, secret: string, algorithm: "SHA-256" | "SHA-512" = "SHA-256") {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0; for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}
export function clientIpHash(request: Request) { const ip = request.headers.get("cf-connecting-ip") || "unknown"; return sha256(`${ip}:${portalEnv.SESSION_SECRET || "unconfigured"}`); }

export function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  for (const item of cookie.split(";")) { const [key, ...rest] = item.trim().split("="); if (key === name) return decodeURIComponent(rest.join("=")); }
  return "";
}
export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 14) { return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
export function clearSessionCookie() { return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }

export async function getSessionUser(request: Request) {
  const token = readCookie(request, SESSION_COOKIE); if (!token) return null;
  const tokenHash = await sha256(token); const now = Date.now();
  return portalEnv.DB.prepare(`SELECT u.id, u.email, u.country_residence AS countryResidence, u.preferred_plan AS preferredPlan,
    EXISTS(SELECT 1 FROM entitlements e WHERE e.user_id=u.id AND e.status='active') AS paid,
    (SELECT e.plan FROM entitlements e WHERE e.user_id=u.id AND e.status='active' ORDER BY e.activated_at DESC LIMIT 1) AS paidPlan
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1`).bind(tokenHash, now).first<{ id: string; email: string; countryResidence: string; preferredPlan: PlanId; paid: number; paidPlan: PlanId | null }>();
}

export async function requireSession(request: Request, paid = false) {
  const user = await getSessionUser(request);
  if (!user) return { error: json({ error: "Sign in required" }, 401), user: null };
  if (paid && !user.paid) return { error: json({ error: "Payment required" }, 402), user: null };
  return { error: null, user };
}

export async function createSession(userId: string) {
  const token = randomId("ses_"); const tokenHash = await sha256(token); const now = Date.now();
  await portalEnv.DB.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)").bind(randomId("s_"), userId, tokenHash, now + 14 * 86400000, now).run();
  return token;
}

export async function audit(event: string, entityType: string, entityId: string | null, actorUserId: string | null, metadata: Record<string, unknown> = {}) {
  await portalEnv.DB.prepare("INSERT INTO audit_events (id,event,actor_user_id,entity_type,entity_id,metadata_json,created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(randomId("evt_"), event, actorUserId, entityType, entityId, JSON.stringify(metadata), Date.now()).run();
}

export async function sendLoginCode(email: string, code: string) {
  if (!portalEnv.ZEPTOMAIL_TOKEN) throw new Error("ZEPTOMAIL_NOT_CONFIGURED");
  const from = portalEnv.ZEPTOMAIL_FROM || "noreply@migrzz.com";
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST", headers: { Authorization: `zoho-enczapikey ${portalEnv.ZEPTOMAIL_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ from: { address: from, name: portalEnv.ZEPTOMAIL_FROM_NAME || "Migrz" }, to: [{ email_address: { address: email } }],
      subject: `${code} is your Migrz sign-in code`, textbody: `Your Migrz sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`,
      htmlbody: `<div style="font-family:Arial,sans-serif;color:#172333;max-width:560px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><p>Your one-time sign-in code is:</p><p style="font-size:34px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. Migrz will never ask you to share it.</p></div>` }),
  });
  if (!response.ok) throw new Error(`ZEPTOMAIL_${response.status}`);
}

export function integrationStatus() {
  return { email: Boolean(portalEnv.ZEPTOMAIL_TOKEN && portalEnv.SESSION_SECRET), paystack: Boolean(portalEnv.PAYSTACK_SECRET_KEY), paypal: Boolean(portalEnv.PAYPAL_CLIENT_ID && portalEnv.PAYPAL_CLIENT_SECRET && portalEnv.PAYPAL_WEBHOOK_ID) };
}

export function paymentAmount(provider: ProviderId, plan: PlanId) {
  if (provider === "paystack" && (portalEnv.PAYSTACK_CURRENCY || "USD").toUpperCase() !== "USD") {
    const configured = plan === "standard" ? portalEnv.PAYSTACK_STANDARD_AMOUNT_MINOR : portalEnv.PAYSTACK_ACCELERATED_AMOUNT_MINOR;
    if (!configured || !/^\d+$/.test(configured)) throw new Error("PAYSTACK_AMOUNT_NOT_CONFIGURED");
    return { amountMinor: Number(configured), currency: (portalEnv.PAYSTACK_CURRENCY || "NGN").toUpperCase() };
  }
  return { amountMinor: plans[plan].usdMinor, currency: "USD" };
}

export function paypalBaseUrl() { return portalEnv.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"; }
export async function paypalAccessToken() {
  if (!portalEnv.PAYPAL_CLIENT_ID || !portalEnv.PAYPAL_CLIENT_SECRET) throw new Error("PAYPAL_NOT_CONFIGURED");
  const basic = btoa(`${portalEnv.PAYPAL_CLIENT_ID}:${portalEnv.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!response.ok) throw new Error(`PAYPAL_AUTH_${response.status}`); const data = await response.json() as { access_token: string }; return data.access_token;
}

export async function activatePayment(paymentId: string, providerReference: string) {
  const payment = await portalEnv.DB.prepare("SELECT id,user_id AS userId,plan,status FROM payments WHERE id=? LIMIT 1").bind(paymentId).first<{ id: string; userId: string; plan: PlanId; status: string }>();
  if (!payment) throw new Error("PAYMENT_NOT_FOUND"); if (payment.status === "paid") return;
  const now = Date.now();
  await portalEnv.DB.batch([
    portalEnv.DB.prepare("UPDATE payments SET status='paid',provider_reference=?,paid_at=?,updated_at=? WHERE id=? AND status!='paid'").bind(providerReference, now, now, paymentId),
    portalEnv.DB.prepare("INSERT OR IGNORE INTO entitlements (id,user_id,payment_id,plan,status,activated_at) VALUES (?,?,?,?,?,?)").bind(randomId("ent_"), payment.userId, paymentId, payment.plan, "active", now),
    portalEnv.DB.prepare("INSERT OR IGNORE INTO applications (id,user_id,status,current_section,answers_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(randomId("app_"), payment.userId, "draft", 1, "{}", now, now),
  ]);
  await audit("payment_activated", "payment", paymentId, payment.userId, { providerReference, plan: payment.plan });
}
