/**
 * Format Date object thành string YYYY-MM-DD HH:mm:ss (local time, không dùng UTC)
 * Tránh lỗi lệch giờ khi server chạy ở múi giờ khác
 * @param {Date} date
 * @returns {string}
 */
function formatDateTimeStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

module.exports = formatDateTimeStr;
