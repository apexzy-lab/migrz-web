import { portalEnv } from "@/app/portal/server";

const apiBase = "https://api.calendly.com";

async function calendlyFetch(path: string, init?: RequestInit) {
  if (!portalEnv.CALENDLY_API_TOKEN) throw new Error("CALENDLY_NOT_CONFIGURED");
  const response = await fetch(path.startsWith("http") ? path : `${apiBase}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${portalEnv.CALENDLY_API_TOKEN}`, "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`CALENDLY_${response.status}_${(await response.text()).slice(0, 180)}`);
  return response.json() as Promise<Record<string, unknown>>;
}

export type CalendlySlot = { startTime: string; status: string };

export async function calendlyAvailableTimes(startTime: string, endTime: string) {
  if (!portalEnv.CALENDLY_EVENT_TYPE_URI) throw new Error("CALENDLY_EVENT_TYPE_NOT_CONFIGURED");
  const params = new URLSearchParams({ event_type: portalEnv.CALENDLY_EVENT_TYPE_URI, start_time: startTime, end_time: endTime });
  const data = await calendlyFetch(`/event_type_available_times?${params}`) as { collection?: Array<{ start_time?: string; status?: string }> };
  return (data.collection || []).filter((slot) => slot.start_time && slot.status === "available").map((slot) => ({ startTime: slot.start_time!, status: slot.status! }));
}

export async function scheduleCalendlyInvitee(input: { startTime: string; email: string; name: string; timezone: string }) {
  if (!portalEnv.CALENDLY_EVENT_TYPE_URI) throw new Error("CALENDLY_EVENT_TYPE_NOT_CONFIGURED");
  const data = await calendlyFetch("/invitees", { method: "POST", body: JSON.stringify({ event_type: portalEnv.CALENDLY_EVENT_TYPE_URI, start_time: input.startTime, invitee: { email: input.email, name: input.name || input.email, timezone: input.timezone } }) }) as {
    resource?: { uri?: string; cancel_url?: string; reschedule_url?: string; event?: string; status?: string };
  };
  if (!data.resource?.uri || !data.resource.event) throw new Error("CALENDLY_INVALID_BOOKING_RESPONSE");
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
