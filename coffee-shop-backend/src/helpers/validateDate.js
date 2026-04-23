const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Validate date string:
 * - Đúng định dạng YYYY-MM-DD
 * - Là ngày tồn tại thực (không phải 2026-02-30)
 * - Nếu checkFuture=true: không phải ngày trong quá khứ
 * @param {string} date
 * @param {boolean} checkFuture - default true
 */
function validateDate(date, checkFuture = true) {
    if (!date) throw new ErrorResponse(400, 'Thiếu ngày');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new ErrorResponse(400, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)');

    const parsed = new Date(date);
    if (isNaN(parsed.getTime()) || parsed.toISOString().split('T')[0] !== date)
        throw new ErrorResponse(400, 'Ngày không hợp lệ');

    if (checkFuture) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Cho phép ngược 1 ngày để hỗ trợ ca qua đêm bắt đầu "hôm qua"
        // nhưng chưa kết thúc (ví dụ: 23:00–03:00 check lúc 00:30 hôm sau)
        // ShiftService sẽ dùng _buildShiftEndDatetime quyết định cuối cùng
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (parsed < yesterday)
            throw new ErrorResponse(400, 'Không thể gán ca cho ngày trong quá khứ');
    }
}

module.exports = validateDate;
