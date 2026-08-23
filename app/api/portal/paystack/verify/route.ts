import { activatePayment, portalEnv, requireSession } from "@/app/portal/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin; const session = await requireSession(request); if (session.error || !session.user) return Response.redirect(`${origin}/portal?payment=signin`, 303);
  const reference = new URL(request.url).searchParams.get("reference") || ""; if (!reference || !portalEnv.PAYSTACK_SECRET_KEY) return Response.redirect(`${origin}/portal?payment=failed`, 303);
  const payment = await portalEnv.DB.prepare("SELECT id,amount_minor AS amountMinor,currency FROM payments WHERE provider='paystack' AND provider_reference=? AND user_id=? LIMIT 1").bind(reference, session.user.id).first<{ id: string; amountMinor: number; currency: string }>(); if (!payment) return Response.redirect(`${origin}/portal?payment=failed`, 303);
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${portalEnv.PAYSTACK_SECRET_KEY}` } }); const result = await response.json() as { status?: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string } };
  if (response.ok && result.status && result.data?.status === "success" && result.data.amount === payment.amountMinor && result.data.currency === payment.currency) { await activatePayment(payment.id, reference); return Response.redirect(`${origin}/portal?payment=success`, 303); }
  return Response.redirect(`${origin}/portal?payment=pending`, 303);
}
