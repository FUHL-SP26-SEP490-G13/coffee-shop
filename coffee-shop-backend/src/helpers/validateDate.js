const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Kiểm tra date string đúng định dạng YYYY-MM-DD
 * @param {string} date
 */
function validateDate(date) {
    if (!date) throw new ErrorResponse(400, 'Thiếu ngày');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new ErrorResponse(400, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)');
}

module.exports = validateDate;
