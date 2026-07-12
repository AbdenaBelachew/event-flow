const chapa = require("./chapa");
const telebirr = require("./telebirr");
const cbeBirr = require("./cbeBirr");

/** Registry of gateways keyed by their DB enum value. */
const gateways = {
  chapa,
  telebirr,
  cbe_birr: cbeBirr,
};

function getGateway(name) {
  const gw = gateways[name];
  if (!gw) throw new Error(`Unknown payment gateway: ${name}`);
  return gw;
}

module.exports = { getGateway, gateways };
