const QRCode = require("qrcode");

/**
 * Encodes a ticket code into a QR code.
 * Returns a data URL (base64 PNG) suitable for <img src=...> or email.
 */
async function ticketQrDataUrl(ticketCode) {
  return QRCode.toDataURL(ticketCode, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}

/** Returns raw PNG buffer (for file/email attachments). */
async function ticketQrBuffer(ticketCode) {
  return QRCode.toBuffer(ticketCode, { errorCorrectionLevel: "M", margin: 2, width: 320 });
}

module.exports = { ticketQrDataUrl, ticketQrBuffer };
