/**
 * Format Date object thành string YYYY-MM-DD
 * mysql2 với timezone: '+07:00' trả DATE column dưới dạng local midnight +07:00,
 * nên phải dùng getFullYear/getMonth/getDate (local time) để lấy đúng ngày.
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
