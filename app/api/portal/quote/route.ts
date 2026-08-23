import { createPaymentQuote, json, providerForCountry, requireSession, validPlan } from "@/app/portal/server";

export async function POST(request: Request) {
  const session = await requireSession(request); if (session.error || !session.user) return session.error!;
  try {
    const body = await request.json() as { plan?: unknown }; if (!validPlan(body.plan)) return json({ error: "Choose a valid assessment plan." }, 400);
    const result = await createPaymentQuote(session.user.id, body.plan, providerForCountry(session.user.countryResidence));
    return json({ token: result.token, amountMinor: result.quote.amountMinor, currency: result.quote.currency, baseUsdMinor: result.quote.baseUsdMinor, rate: result.quote.rate, source: result.quote.source, quotedAt: result.quote.quotedAt, expiresAt: result.quote.expiresAt });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "QUOTE_FAILED";
    return json({ error: reason.includes("CONFIGURED") ? "NGN conversion is being configured." : "The live NGN rate is temporarily unavailable. Please try again shortly." }, 503);
  }
}
