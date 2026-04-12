/**
 * Format Date object thành string YYYY-MM-DD (local time, không dùng UTC)
 * Tránh lỗi lệch ngày khi server chạy ở UTC+7
 * @param {Date} date
 * @returns {string}
 */
function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

module.exports = formatDateStr;
