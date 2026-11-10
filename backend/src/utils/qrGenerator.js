const QRCode = require('qrcode');

/**
 * Generate QR code as Base64 Data URL for an equipment item or borrow request
 * @param {string|object} data - String or object payload to encode
 * @returns {Promise<string>} Base64 Data URL
 */
async function generateQRCode(data) {
  try {
    const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#1e293b', // Deep blue-grey
        light: '#ffffff'
      },
      width: 300
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

module.exports = { generateQRCode };
