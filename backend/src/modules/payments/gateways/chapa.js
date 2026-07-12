const { env } = require("../../../config/env");

/**
 * Chapa adapter. Implements the shared gateway interface:
 *   initiate({ order, payment, callbackUrl, returnUrl }) ->
 *      { gateway_ref, checkout_url, raw }
 *   verify(gatewayRef) -> { status: 'success'|'failed'|'initiated', raw }
 *   parseWebhook(req) -> { gateway_ref, status, raw }
 *
 * If CHAPA_SECRET_KEY is not configured the adapter runs in SIMULATION mode:
 * it fabricates a tx_ref and returns a hosted "checkout" URL pointing at the
 * bundled mock checkout page so the full flow works end-to-end in dev.
 */
const NAME = "chapa";

function isLive() {
  return Boolean(env.CHAPA_SECRET_KEY);
}

async function initiate({ order, payment, callbackUrl, returnUrl }) {
  const txRef = `chapa-${payment.id}`;

  if (!isLive()) {
    // SIMULATION: return the mock checkout page.
    const checkoutUrl = `${env.APP_BASE_URL}/checkout-mock.html?ref=${encodeURIComponent(
      txRef
    )}&gateway=chapa&amount=${payment.amount_etb}`;
    return { gateway_ref: txRef, checkout_url: checkoutUrl, raw: { simulated: true, txRef } };
  }

  const [firstName, ...rest] = (order.buyer_name || "Guest").split(" ");
  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(payment.amount_etb),
      currency: "ETB",
      email: order.buyer_email,
      first_name: firstName || "Guest",
      last_name: rest.join(" ") || "Buyer",
      phone_number: order.buyer_phone,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
    }),
  });
  const raw = await res.json();
  if (!res.ok || raw.status !== "success") {
    throw new Error(`Chapa init failed: ${raw.message || res.statusText}`);
  }
  return { gateway_ref: txRef, checkout_url: raw.data.checkout_url, raw };
}

async function verify(gatewayRef) {
  if (!isLive()) {
    return { status: "success", raw: { simulated: true } };
  }
  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/verify/${gatewayRef}`, {
    headers: { Authorization: `Bearer ${env.CHAPA_SECRET_KEY}` },
  });
  const raw = await res.json();
  const ok = raw.status === "success" && raw.data && raw.data.status === "success";
  return { status: ok ? "success" : "failed", raw };
}

/** Chapa webhook: { tx_ref, status, ... }. We re-verify server-side for trust. */
async function parseWebhook(req) {
  const body = req.body || {};
  const gatewayRef = body.tx_ref || body.trx_ref || (req.query && req.query.ref);
  if (!gatewayRef) return { gateway_ref: null, status: "failed", raw: body };
  const verified = await verify(gatewayRef);
  return { gateway_ref: gatewayRef, status: verified.status, raw: { webhook: body, verified: verified.raw } };
}

module.exports = { NAME, initiate, verify, parseWebhook, isLive };
