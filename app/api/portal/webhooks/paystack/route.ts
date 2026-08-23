import { activatePayment, hmacHex, json, portalEnv, timingSafeEqual } from "@/app/portal/server";

export async function POST(request: Request) {
  if (!portalEnv.PAYSTACK_SECRET_KEY) return json({ error: "Not configured" }, 503); const body = await request.text(); const signature = request.headers.get("x-paystack-signature") || ""; const expected = await hmacHex(body, portalEnv.PAYSTACK_SECRET_KEY, "SHA-512"); if (!timingSafeEqual(signature, expected)) return json({ error: "Invalid signature" }, 401);
  const event = JSON.parse(body) as { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } }; if (event.event !== "charge.success" || !event.data?.reference) return json({ received: true });
  const payment = await portalEnv.DB.prepare("SELECT id,amount_minor AS amountMinor,currency FROM payments WHERE provider='paystack' AND provider_reference=? LIMIT 1").bind(event.data.reference).first<{ id: string; amountMinor: number; currency: string }>(); if (!payment || event.data.status !== "success" || event.data.amount !== payment.amountMinor || event.data.currency !== payment.currency) return json({ received: true });
  await activatePayment(payment.id, event.data.reference); return json({ received: true });
}
