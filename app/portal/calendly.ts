import { hmacHex, portalEnv, timingSafeEqual } from "@/app/portal/server";

const apiBase = "https://api.calendly.com";

async function calendlyFetch(path: string, init?: RequestInit, attempt = 0) {
  if (!portalEnv.CALENDLY_API_TOKEN) throw new Error("CALENDLY_NOT_CONFIGURED");
  const response = await fetch(path.startsWith("http") ? path : `${apiBase}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${portalEnv.CALENDLY_API_TOKEN}`, "content-type": "application/json", ...init?.headers },
  });
  if (response.status === 429 && attempt < 2) {
    const retryAfter = Number(response.headers.get("retry-after") || 1);
    await new Promise((resolve) => setTimeout(resolve, Math.min(5000, Math.max(750, retryAfter * 1000))));
    return calendlyFetch(path, init, attempt + 1);
  }
  if (!response.ok) throw new CalendlyApiError(response.status, (await response.text()).slice(0, 500));
  return response.json() as Promise<Record<string, unknown>>;
}

export class CalendlyApiError extends Error {
  constructor(public status: number, public providerDetail: string) {
    super(`CALENDLY_${status}`);
    this.name = "CalendlyApiError";
  }
}

export function calendlyErrorCode(error: unknown) {
  if (error instanceof CalendlyApiError) {
    const detail = error.providerDetail.toLowerCase();
    if (detail.includes("location")) return "location_invalid";
    if (detail.includes("available") || detail.includes("start_time")) return "slot_unavailable";
    if (error.status === 401) return "token_invalid";
    if (error.status === 403) return "booking_not_permitted";
    return `provider_${error.status}`;
  }
  if (error instanceof Error && error.message.startsWith("CALENDLY_")) return error.message.slice(9).toLowerCase();
  return "unknown";
}

export type CalendlySlot = { startTime: string; status: string; bookingToken: string };

type CalendlyIdentity = { resource?: { uri?: string; current_organization?: string } };
type CalendlyLocation = { kind?: string; location?: string };
type CalendlyEventType = { uri?: string; name?: string; active?: boolean; duration?: number; locations?: CalendlyLocation[] };
type BookingContext = { eventTypeUri: string; startTime: string; userId: string; expiresAt: number; location?: CalendlyLocation };

let eventTypeCache: { value: CalendlyEventType; expiresAt: number } | null = null;

async function calendlyIdentity() { return calendlyFetch("/users/me") as Promise<CalendlyIdentity>; }

async function resolveCalendlyEventType() {
  if (eventTypeCache && eventTypeCache.expiresAt > Date.now()) return eventTypeCache.value;
  if (portalEnv.CALENDLY_EVENT_TYPE_URI) {
    const configured = await calendlyFetch(portalEnv.CALENDLY_EVENT_TYPE_URI) as { resource?: CalendlyEventType };
    if (!configured.resource?.uri) throw new Error("CALENDLY_EVENT_TYPE_NOT_FOUND");
    eventTypeCache = { value: configured.resource, expiresAt: Date.now() + 10 * 60 * 1000 };
    return configured.resource;
  }
  const identity = await calendlyIdentity(); const userUri = identity.resource?.uri;
  if (!userUri) throw new Error("CALENDLY_USER_UNAVAILABLE");
  const data = await calendlyFetch(`/event_types?user=${encodeURIComponent(userUri)}&active=true&count=100`) as { collection?: CalendlyEventType[] };
  const activeSixtyMinute = (data.collection || []).filter((eventType) => eventType.active !== false && eventType.duration === 60 && eventType.uri);
  const preferred = activeSixtyMinute.find((eventType) => /migrz.*(assessment|review)|(assessment|review).*migrz/i.test(eventType.name || "")) || (activeSixtyMinute.length === 1 ? activeSixtyMinute[0] : null);
  if (!preferred?.uri) throw new Error(activeSixtyMinute.length ? "CALENDLY_EVENT_TYPE_AMBIGUOUS" : "CALENDLY_EVENT_TYPE_NOT_FOUND");
  eventTypeCache = { value: preferred, expiresAt: Date.now() + 10 * 60 * 1000 };
  return preferred;
}

export async function resolveCalendlyEventTypeUri() { return (await resolveCalendlyEventType()).uri!; }

function automaticLocation(eventType: CalendlyEventType) {
  const locations = (eventType.locations || []).filter((location) => location.kind);
  const selected = locations.find((location) => /_conference$/.test(location.kind || "")) || (locations.length === 1 && !["ask_invitee", "outbound_call"].includes(locations[0].kind || "") ? locations[0] : null);
  if (locations.length && !selected?.kind) throw new Error("CALENDLY_LOCATION_INPUT_REQUIRED");
  return selected?.kind ? { kind: selected.kind, ...(selected.location ? { location: selected.location } : {}) } : undefined;
}

function encodeBookingPayload(value: string) { return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); }
function decodeBookingPayload(value: string) { const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4); return atob(padded); }
async function createBookingToken(context: BookingContext) {
  if (!portalEnv.SESSION_SECRET) throw new Error("SESSION_NOT_CONFIGURED");
  const payload = encodeBookingPayload(JSON.stringify(context)); const signature = await hmacHex(`calendly-slot:${payload}`, portalEnv.SESSION_SECRET);
  return `${payload}.${signature}`;
}
async function verifyBookingToken(token: string, userId: string, startTime: string) {
  if (!portalEnv.SESSION_SECRET) throw new Error("SESSION_NOT_CONFIGURED");
  const [payload, signature] = token.split("."); if (!payload || !signature) throw new Error("CALENDLY_BOOKING_TOKEN_INVALID");
  const expected = await hmacHex(`calendly-slot:${payload}`, portalEnv.SESSION_SECRET); if (!timingSafeEqual(signature, expected)) throw new Error("CALENDLY_BOOKING_TOKEN_INVALID");
  const context = JSON.parse(decodeBookingPayload(payload)) as BookingContext;
  if (context.userId !== userId || context.startTime !== startTime || context.expiresAt < Date.now() || !context.eventTypeUri.startsWith(`${apiBase}/event_types/`)) throw new Error("CALENDLY_BOOKING_TOKEN_INVALID");
  return context;
}

export async function calendlyAvailableTimes(startTime: string, endTime: string, userId: string) {
  const eventType = await resolveCalendlyEventType(); const eventTypeUri = eventType.uri!; const location = automaticLocation(eventType);
  const params = new URLSearchParams({ event_type: eventTypeUri, start_time: startTime, end_time: endTime });
  const data = await calendlyFetch(`/event_type_available_times?${params}`) as { collection?: Array<{ start_time?: string; status?: string }> };
  return Promise.all((data.collection || []).filter((slot) => slot.start_time && slot.status === "available").map(async (slot) => ({ startTime: slot.start_time!, status: slot.status!, bookingToken: await createBookingToken({ eventTypeUri, startTime: slot.start_time!, userId, expiresAt: Date.now() + 20 * 60 * 1000, location }) })));
}

export async function scheduleCalendlyInvitee(input: { startTime: string; email: string; name: string; timezone: string; userId: string; bookingToken?: string }) {
  const context = input.bookingToken ? await verifyBookingToken(input.bookingToken, input.userId, input.startTime) : null;
  const eventType = context ? null : await resolveCalendlyEventType(); const eventTypeUri = context?.eventTypeUri || eventType?.uri || ""; const location = context?.location || (eventType ? automaticLocation(eventType) : undefined);
  const data = await calendlyFetch("/invitees", { method: "POST", body: JSON.stringify({ event_type: eventTypeUri, start_time: input.startTime, invitee: { email: input.email, name: input.name || input.email, timezone: input.timezone }, ...(location ? { location } : {}) }) }) as {
    resource?: { uri?: string; cancel_url?: string; reschedule_url?: string; event?: string; status?: string };
  };
  if (!data.resource?.uri || !data.resource.event) throw new Error("CALENDLY_INVALID_BOOKING_RESPONSE");
  await ensureCalendlyWebhook().catch(() => undefined);
  const event = await calendlyFetch(data.resource.event) as { resource?: { uri?: string; start_time?: string; end_time?: string; location?: { join_url?: string; location?: string; type?: string } } };
  return {
    inviteeUri: data.resource.uri,
    eventUri: data.resource.event,
    cancelUrl: data.resource.cancel_url || null,
    rescheduleUrl: data.resource.reschedule_url || null,
    startTime: event.resource?.start_time || input.startTime,
    meetingUrl: event.resource?.location?.join_url || (event.resource?.location?.location?.startsWith("https://") ? event.resource.location.location : null),
  };
}

async function calendlyWebhookKey() {
  if (!portalEnv.SESSION_SECRET) throw new Error("SESSION_NOT_CONFIGURED");
  return hmacHex("migrz-calendly-webhook-v1", portalEnv.SESSION_SECRET);
}

export async function ensureCalendlyWebhook() {
  const identity = await calendlyIdentity(); const user = identity.resource?.uri; const organization = identity.resource?.current_organization;
  if (!user || !organization) throw new Error("CALENDLY_IDENTITY_UNAVAILABLE");
  const key = await calendlyWebhookKey(); const callbackUrl = `https://apply.migrzz.com/api/portal/webhooks/calendly?key=${key}`;
  const params = new URLSearchParams({ organization, scope: "user", user });
  const existing = await calendlyFetch(`/webhook_subscriptions?${params}`) as { collection?: Array<{ callback_url?: string; uri?: string; state?: string }> };
  if ((existing.collection || []).some((subscription) => subscription.callback_url === callbackUrl && subscription.state !== "disabled")) return;
  await calendlyFetch("/webhook_subscriptions", { method: "POST", body: JSON.stringify({ url: callbackUrl, events: ["invitee.created", "invitee.canceled"], organization, user, scope: "user" }) });
}

export function calendlyWebhookSignatureIsValid(rawBody: string, signatureHeader: string) {
  const key = portalEnv.CALENDLY_WEBHOOK_SIGNING_KEY || "";
  if (!key) return Promise.resolve(false);
  const values = Object.fromEntries(signatureHeader.split(",").map((part) => part.trim().split("=", 2)));
  const timestamp = values.t; const received = values.v1;
  if (!timestamp || !received || Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60 * 1000) return Promise.resolve(false);
  return crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]).then(async (cryptoKey) => {
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
    const expected = [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (expected.length !== received.length) return false;
    let mismatch = 0; for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
    return mismatch === 0;
  });
}

export async function calendlyWebhookRequestIsValid(request: Request, rawBody: string) {
  const signature = request.headers.get("calendly-webhook-signature") || "";
  if (signature && portalEnv.CALENDLY_WEBHOOK_SIGNING_KEY && await calendlyWebhookSignatureIsValid(rawBody, signature)) return true;
  const received = new URL(request.url).searchParams.get("key") || ""; if (!received) return false;
  const expected = await calendlyWebhookKey(); return timingSafeEqual(expected, received);
}
