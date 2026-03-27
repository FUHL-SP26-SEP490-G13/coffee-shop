/**
 * Format Date object thành string YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDateStr(date) {
    return date.toISOString().split('T')[0];
}

module.exports = formatDateStr;
