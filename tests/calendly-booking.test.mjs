import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Calendly booking includes the configured location and degrades safely", async () => {
  const [calendar, appointment, client] = await Promise.all([
    readFile(new URL("../app/portal/calendly.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/portal/appointment/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/portal/portal-client.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(calendar, /automaticLocation/);
  assert.match(calendar, /\.\.\.\(location \? \{ location \} : \{\}\)/);
  assert.match(calendar, /calendlyErrorCode/);
  assert.match(appointment, /appointment_booking_failed/);
  assert.match(appointment, /bookingFallback: Boolean\(useCalendly && !booking\)/);
  assert.doesNotMatch(appointment, /That live slot is no longer available/);
  assert.match(client, /Calendly could not confirm instantly/);
});
