import { env } from "cloudflare:workers";
import { sendPortalEmail } from "@/app/portal/email";

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
  WISE_API_TOKEN?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_MODE?: string;
  CALENDLY_API_TOKEN?: string;
  CALENDLY_EVENT_TYPE_URI?: string;
  CALENDLY_WEBHOOK_SIGNING_KEY?: string;
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
export function submissionPublicId() { return `MZ-${new Date().getUTCFullYear()}-${randomId().slice(0, 8).toUpperCase()}`; }
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
    (SELECT e.plan FROM entitlements e WHERE e.user_id=u.id AND e.status='active' ORDER BY e.activated_at DESC LIMIT 1) AS paidPlan,
    EXISTS(SELECT 1 FROM admins a WHERE a.user_id=u.id AND a.status='active') AS admin
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1`).bind(tokenHash, now).first<{ id: string; email: string; countryResidence: string; preferredPlan: PlanId; paid: number; paidPlan: PlanId | null; admin: number }>();
}

export async function requireSession(request: Request, paid = false) {
  const user = await getSessionUser(request);
  if (!user) return { error: json({ error: "Sign in required" }, 401), user: null };
  if (paid && !user.paid) return { error: json({ error: "Payment required" }, 402), user: null };
  return { error: null, user };
}

export async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return { error: json({ error: "Sign in required" }, 401), user: null };
  if (!user.admin) return { error: json({ error: "Administrator access required" }, 403), user: null };
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
  await sendPortalEmail(
    { token: portalEnv.ZEPTOMAIL_TOKEN, from: portalEnv.ZEPTOMAIL_FROM, fromName: portalEnv.ZEPTOMAIL_FROM_NAME },
    email,
    `${code} is your Migrz sign-in code`,
    `Your Migrz sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`,
    `<div style="font-family:Arial,sans-serif;color:#172333;max-width:560px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><p>Your one-time sign-in code is:</p><p style="font-size:34px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. Migrz will never ask you to share it.</p></div>`,
  );
}

export function integrationStatus() {
  return { email: Boolean(portalEnv.ZEPTOMAIL_TOKEN && portalEnv.SESSION_SECRET), paystack: Boolean(portalEnv.PAYSTACK_SECRET_KEY), paypal: Boolean(portalEnv.PAYPAL_CLIENT_ID && portalEnv.PAYPAL_CLIENT_SECRET && portalEnv.PAYPAL_WEBHOOK_ID), wise: Boolean(portalEnv.WISE_API_TOKEN), calendly: Boolean(portalEnv.CALENDLY_API_TOKEN && portalEnv.CALENDLY_EVENT_TYPE_URI) };
}

export async function createNotification(userId: string, type: string, title: string, message: string, actionLabel?: string, actionView?: string, entityType?: string, entityId?: string) {
  const id = randomId("ntf_");
  await portalEnv.DB.prepare("INSERT INTO notifications (id,user_id,type,title,message,action_label,action_view,entity_type,entity_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(id, userId, type, title, message, actionLabel || null, actionView || null, entityType || null, entityId || null, Date.now()).run();
  return id;
}

export type PaymentQuote = { userId: string; plan: PlanId; provider: ProviderId; baseUsdMinor: number; amountMinor: number; currency: "USD" | "NGN"; rate: number | null; source: "Wise" | "Migrz"; quotedAt: number; expiresAt: number };

function quotePayload(value: PaymentQuote) { return btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); }
function readQuotePayload(value: string) { const normalized = value.replaceAll("-", "+").replaceAll("_", "/"); return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as PaymentQuote; }

export async function createPaymentQuote(userId: string, plan: PlanId, provider: ProviderId) {
  const quotedAt = Date.now(); const baseUsdMinor = plans[plan].usdMinor;
  let quote: PaymentQuote;
  if (provider === "paystack") {
    if (!portalEnv.WISE_API_TOKEN) throw new Error("WISE_NOT_CONFIGURED");
    const response = await fetch("https://api.wise.com/v1/rates?source=USD&target=NGN", { headers: { Authorization: `Bearer ${portalEnv.WISE_API_TOKEN}` } });
    const rates = await response.json() as Array<{ rate?: number; source?: string; target?: string; time?: string }>;
    const current = Array.isArray(rates) ? rates.find((item) => item.source === "USD" && item.target === "NGN" && Number(item.rate) > 0) : null;
    if (!response.ok || !current?.rate) throw new Error("WISE_RATE_UNAVAILABLE");
    const rate = Number(current.rate); const amountMinor = Math.round((baseUsdMinor / 100) * rate) * 100;
    quote = { userId, plan, provider, baseUsdMinor, amountMinor, currency: "NGN", rate, source: "Wise", quotedAt, expiresAt: quotedAt + 15 * 60000 };
  } else quote = { userId, plan, provider, baseUsdMinor, amountMinor: baseUsdMinor, currency: "USD", rate: null, source: "Migrz", quotedAt, expiresAt: quotedAt + 15 * 60000 };
  if (!portalEnv.SESSION_SECRET) throw new Error("SESSION_NOT_CONFIGURED");
  const payload = quotePayload(quote); const signature = await hmacHex(payload, portalEnv.SESSION_SECRET); return { quote, token: `${payload}.${signature}` };
}

export async function verifyPaymentQuote(token: unknown, userId: string, plan: PlanId, provider: ProviderId) {
  if (typeof token !== "string" || !portalEnv.SESSION_SECRET) return null; const [payload, signature] = token.split("."); if (!payload || !signature) return null;
  const expected = await hmacHex(payload, portalEnv.SESSION_SECRET); if (!timingSafeEqual(signature, expected)) return null;
  try { const quote = readQuotePayload(payload); if (quote.userId !== userId || quote.plan !== plan || quote.provider !== provider || quote.expiresAt < Date.now() || !Number.isInteger(quote.amountMinor) || quote.amountMinor <= 0) return null; return quote; } catch { return null; }
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
    portalEnv.DB.prepare("INSERT OR IGNORE INTO applications (id,user_id,public_id,status,review_status,current_section,answers_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(randomId("app_"), payment.userId, submissionPublicId(), "draft", "draft", 1, "{}", now, now),
  ]);
  await audit("payment_activated", "payment", paymentId, payment.userId, { providerReference, plan: payment.plan });
}
