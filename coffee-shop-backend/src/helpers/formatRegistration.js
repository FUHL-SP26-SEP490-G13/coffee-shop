/**
 * Format dữ liệu registration trả về cho client
 * @param {object} reg       - shift_registration row
 * @param {object} user      - user row
 * @param {object} shift     - shift row
 * @param {object} template  - shift_template row
 * @param {string} date      - 'YYYY-MM-DD'
 * @returns {object}
 */
function formatRegistration(reg, user, shift, template, date) {
    return {
        registration_id: reg.id,
        shift_id: shift.id,
        date,
        template: {
            id: template.id,
            name: template.name,
            start_time: template.start_time,
            end_time: template.end_time,
        },
        user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
        },
        status: reg.status,
    };
}

module.exports = formatRegistration;
