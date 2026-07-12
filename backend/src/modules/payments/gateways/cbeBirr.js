const { env } = require("../../../config/env");

/**
 * CBE Birr adapter — STUB behind the shared interface.
 * Replace with the real CBE Birr merchant API once credentials
 * (CBE_BIRR_MERCHANT_ID / CBE_BIRR_API_KEY) are provisioned. Runs in
 * SIMULATION mode for now.
 */
const NAME = "cbe_birr";

async function initiate({ payment }) {
  const txRef = `cbebirr-${payment.id}`;
  const checkoutUrl = `${env.APP_BASE_URL}/checkout-mock.html?ref=${encodeURIComponent(
    txRef
  )}&gateway=cbe_birr&amount=${payment.amount_etb}`;
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
