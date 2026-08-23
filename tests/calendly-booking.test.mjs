import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Calendly booking uses signed slots, retries rate limits and supports admin sync", async () => {
  const [calendar, availability, appointment, adminAppointment, client] = await Promise.all([
    readFile(new URL("../app/portal/calendly.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/portal/appointment/availability/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/portal/appointment/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/appointments/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/portal/portal-client.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(calendar, /createBookingToken/);
  assert.match(calendar, /verifyBookingToken/);
  assert.match(calendar, /response\.status === 429/);
  assert.match(calendar, /\.\.\.\(location \? \{ location \} : \{\}\)/);
  assert.match(calendar, /calendlyErrorCode/);
  assert.match(calendar, /integration_cache/);
  assert.match(calendar, /hostedBookingUrl/);
  assert.match(availability, /session\.user\.id/);
  assert.match(appointment, /appointment_booking_failed/);
  assert.match(appointment, /bookingFallback: Boolean\(useCalendly && !booking\)/);
  assert.match(appointment, /refreshSlots: true/);
  assert.match(appointment, /provider_booking_url/);
  assert.match(appointment, /ensureCalendlyWebhook/);
  assert.match(adminAppointment, /appointment_calendly_synced/);
  assert.match(adminAppointment, /shouldSyncCalendly/);
  assert.match(client, /slotTokens\[requestedStart\]/);
  assert.match(client, /Complete the booking securely in Calendly/);
  assert.match(client, /Choose time in Calendly/);
});
