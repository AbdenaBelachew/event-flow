const crypto = require("crypto");

/**
 * Generates a unique, human-scannable ticket code, e.g. "TKT-3F9K-2AQ7-XM4P".
 * Uses Crockford-ish alphabet (no ambiguous chars) for readability.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I,L,O,0,1

function segment(len = 4) {
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function generateTicketCode() {
  return `TKT-${segment()}-${segment()}-${segment()}`;
}

module.exports = { generateTicketCode };
