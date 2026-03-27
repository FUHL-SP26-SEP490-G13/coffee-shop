const QRCode = require('qrcode');

/**
 * Sinh QR code base64 từ URL
 * @param {string} url - Đường dẫn sẽ nhúng vào QR code
 * @returns {Promise<string>} - Chuỗi base64 PNG
 */
async function generateQrCode(url) {
	try {
		return await QRCode.toDataURL(url);
	} catch (err) {
		throw new Error('Không thể tạo QR code: ' + err.message);
	}
}

module.exports = generateQrCode;
