const { env } = require("../../../config/env");

/**
 * Telebirr adapter — STUB behind the shared interface.
 * Telebirr's production flow uses signed/encrypted payloads to a merchant
 * endpoint; wire real credentials (TELEBIRR_APP_ID / TELEBIRR_APP_KEY) and the
 * signing logic here. For now it always runs in SIMULATION mode.
 */
const NAME = "telebirr";

async function initiate({ payment }) {
  const txRef = `telebirr-${payment.id}`;
  const checkoutUrl = `${env.APP_BASE_URL}/checkout-mock.html?ref=${encodeURIComponent(
    txRef
  )}&gateway=telebirr&amount=${payment.amount_etb}`;
  return { gateway_ref: txRef, checkout_url: checkoutUrl, raw: { simulated: true, txRef } };
}

async function verify(_gatewayRef) {
  return { status: "success", raw: { simulated: true } };
}

async function parseWebhook(req) {
  const gatewayRef = (req.body && req.body.tx_ref) || (req.query && req.query.ref) || null;
  const verified = await verify(gatewayRef);
  return { gateway_ref: gatewayRef, status: verified.status, raw: { webhook: req.body } };
}

module.exports = { NAME, initiate, verify, parseWebhook, isLive: () => false };
