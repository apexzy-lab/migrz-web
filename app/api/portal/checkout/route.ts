import { audit, json, paypalAccessToken, paypalBaseUrl, plans, portalEnv, providerForCountry, randomId, requireSession, validPlan, verifyPaymentQuote } from "@/app/portal/server";

export async function POST(request: Request) {
  try {
    const session = await requireSession(request); if (session.error || !session.user) return session.error!; if (session.user.paid) return json({ error: "This account already has an active assessment." }, 409);
    const body = await request.json() as { plan?: unknown; quoteToken?: unknown }; if (!validPlan(body.plan)) return json({ error: "Choose a valid assessment plan." }, 400);
    const plan = body.plan; const provider = providerForCountry(session.user.countryResidence); const quote = await verifyPaymentQuote(body.quoteToken, session.user.id, plan, provider); if (!quote) return json({ error: "Your price quote expired. Refresh the rate and try again." }, 409); const price = { amountMinor: quote.amountMinor, currency: quote.currency }; const paymentId = randomId("pay_"); const now = Date.now(); const origin = new URL(request.url).origin;
    await portalEnv.DB.prepare("INSERT INTO payments (id,user_id,plan,provider,amount_minor,currency,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(paymentId, session.user.id, plan, provider, price.amountMinor, price.currency, "pending", now, now).run();
    let checkoutUrl = ""; let reference = "";
    if (provider === "paystack") {
      if (!portalEnv.PAYSTACK_SECRET_KEY) return json({ error: "Paystack checkout is being configured." }, 503);
      reference = paymentId.replaceAll("_", "-");
      const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${portalEnv.PAYSTACK_SECRET_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ email: session.user.email, amount: String(price.amountMinor), currency: price.currency, reference, callback_url: `${origin}/api/portal/paystack/verify`, metadata: JSON.stringify({ payment_id: paymentId, plan, product: "migrz_assessment" }) }) });
      const result = await response.json() as { status?: boolean; data?: { authorization_url?: string; reference?: string } }; if (!response.ok || !result.status || !result.data?.authorization_url) throw new Error("PAYSTACK_INITIALIZE_FAILED"); checkoutUrl = result.data.authorization_url; reference = result.data.reference || reference;
    } else {
      if (!portalEnv.PAYPAL_CLIENT_ID || !portalEnv.PAYPAL_CLIENT_SECRET) return json({ error: "PayPal checkout is being configured." }, 503);
      const token = await paypalAccessToken(); const value = (price.amountMinor / 100).toFixed(2);
      const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", "paypal-request-id": paymentId }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ custom_id: paymentId, description: plans[plan].name, amount: { currency_code: price.currency, value } }], payment_source: { paypal: { experience_context: { user_action: "PAY_NOW", return_url: `${origin}/api/portal/paypal/capture`, cancel_url: `${origin}/portal?payment=cancelled` } } } }) });
      const result = await response.json() as { id?: string; links?: Array<{ rel: string; href: string }> }; if (!response.ok || !result.id) throw new Error("PAYPAL_INITIALIZE_FAILED"); reference = result.id; checkoutUrl = result.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href || ""; if (!checkoutUrl) throw new Error("PAYPAL_APPROVAL_URL_MISSING");
    }
    await portalEnv.DB.prepare("UPDATE payments SET provider_reference=?,checkout_url=?,updated_at=? WHERE id=?").bind(reference, checkoutUrl, Date.now(), paymentId).run(); await audit("checkout_created", "payment", paymentId, session.user.id, { provider, plan, currency: price.currency, amountMinor: price.amountMinor, baseUsdMinor: quote.baseUsdMinor, fxRate: quote.rate, fxSource: quote.source, quotedAt: quote.quotedAt });
    return json({ checkoutUrl, provider });
  } catch (error) { const message = error instanceof Error ? error.message : "CHECKOUT_FAILED"; return json({ error: message.includes("CONFIGURED") ? "Payment configuration is incomplete." : "Unable to start checkout. No charge was made." }, 502); }
}
