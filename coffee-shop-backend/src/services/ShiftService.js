const ShiftRepository = require('../repositories/ShiftRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const validateDate = require('../helpers/validateDate');
const formatDateStr = require('../helpers/formatDateStr');

class ShiftService {
    // GÁN CA TỪNG NGÀY LẺ 
    async assignSingle({ date, user_id, template_id }) {

        validateDate(date);
        if (!user_id) throw new ErrorResponse(400, 'Thiếu user_id');
        if (!template_id) throw new ErrorResponse(400, 'Thiếu template_id');

        const template = await ShiftRepository.findTemplateById(template_id);
        if (!template) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

        const user = await ShiftRepository.findUserById(user_id);
        if (!user) throw new ErrorResponse(404, 'Nhân viên không tồn tại');
        if (!user.isActive) throw new ErrorResponse(400, 'Nhân viên đã ngừng hoạt động');

        // findOrCreate shift (slot ca của ngày đó)
        const shift = await ShiftRepository.findOrCreateShift(template_id, date);

        // Kiểm tra nhân viên đã được gán ca này chưa
        const existing = await ShiftRepository.findRegistration(user_id, shift.id);
        if (existing && existing.status !== 'cancelled')
            throw new ErrorResponse(
                400,
                `${user.first_name} ${user.last_name} đã được phân vào ${template.name} ngày ${date}`,
            );

        // Nếu đã có nhưng bị cancelled --> reactivate
        let registration;
        if (existing && existing.status === 'cancelled') {
            registration = await ShiftRepository.reactivateRegistration(existing.id);
        } else {
            registration = await ShiftRepository.createRegistration(user_id, shift.id);
        }

        return {
            registration_id: registration.id,
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
            status: registration.status,
        };
    }

    // GÁN CA HÀNG LOẠT THEO TUẦN
    // days_of_week: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
    async assignBulk({ start_date, weeks, assignments }) {
        validateDate(start_date, false);
        if (!weeks || weeks < 1 || weeks > 12)
            throw new ErrorResponse(400, 'Số tuần phải từ 1 đến 12');
        if (!Array.isArray(assignments) || assignments.length === 0)
            throw new ErrorResponse(400, 'Danh sách gán ca trống');


        console.log(assignments)
        // Validate cấu trúc từng assignment
        for (const a of assignments) {
            if (!a.user_id || !a.template_id || !Array.isArray(a.days_of_week))
                throw new ErrorResponse(400, 'Dữ liệu gán ca không hợp lệ');
            if (a.days_of_week.length === 0)
                throw new ErrorResponse(400, 'days_of_week không được rỗng');
            if (a.days_of_week.some((d) => d < 0 || d > 6))
                throw new ErrorResponse(400, 'days_of_week phải từ 0 (CN) đến 6 (T7)');
        }

        // Fetch tất cả unique users & templates 
        const uniqueUserIds = [...new Set(assignments.map((a) => a.user_id))];
        const uniqueTemplateIds = [...new Set(assignments.map((a) => a.template_id))];

        const [users, templates] = await Promise.all([
            Promise.all(uniqueUserIds.map((id) => ShiftRepository.findUserById(id))),
            Promise.all(uniqueTemplateIds.map((id) => ShiftRepository.findTemplateById(id))),
        ]);

        const userMap = new Map(uniqueUserIds.map((id, i) => [id, users[i]]));
        const templateMap = new Map(uniqueTemplateIds.map((id, i) => [id, templates[i]]));

        // Validate tồn tại và trạng thái hoạt động
        for (const a of assignments) {
            const user = userMap.get(a.user_id);
            if (!user) throw new ErrorResponse(404, `Nhân viên id=${a.user_id} không tồn tại`);
            if (!user.isActive) throw new ErrorResponse(400, `Nhân viên id=${a.user_id} đã ngừng hoạt động`);
            if (!templateMap.get(a.template_id))
                throw new ErrorResponse(404, `Ca id=${a.template_id} không tồn tại`);
        }

        // Sinh ra tất cả ngày cần gán
        const startDate = new Date(start_date);
        const totalDays = weeks * 7;
        let successCount = 0;
        let skipCount = 0;
        const results = [];

        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayOffset);
            const dayOfWeek = currentDate.getDay(); // 0=CN, 1=T2...
            const dateStr = formatDateStr(currentDate);

            for (const assignment of assignments) {
                if (!assignment.days_of_week.includes(dayOfWeek)) continue;

                try {
                    const shift = await ShiftRepository.findOrCreateShift(
                        assignment.template_id,
                        dateStr,
                    );
                    const existing = await ShiftRepository.findRegistration(
                        assignment.user_id,
                        shift.id,
                    );

                    if (existing && existing.status !== 'cancelled') {
                        skipCount++;
                        continue; // Đã gán rồi → bỏ qua, không báo lỗi
                    }

                    if (existing && existing.status === 'cancelled') {
                        await ShiftRepository.reactivateRegistration(existing.id);
                    } else {
                        await ShiftRepository.createRegistration(assignment.user_id, shift.id);
                    }

                    successCount++;
                    results.push({ date: dateStr, user_id: assignment.user_id, template_id: assignment.template_id });
                } catch (err) {
                    // Bỏ qua lỗi duplicate, tiếp tục
                    skipCount++;
                }
            }
        }

        return {
            total: successCount,
            skipped: skipCount,
            details: results,
        };
    }

    // XÓA NHÂN VIÊN KHỎI CA
    async removeRegistration(registrationId) {
        const reg = await ShiftRepository.findRegistrationById(registrationId);
        if (!reg) throw new ErrorResponse(404, 'Không tìm thấy lịch làm việc này');

        // Không cho xóa nếu đã có leave_request pending/approved
        if (reg.leave_request_id)
            throw new ErrorResponse(
                400,
                'Nhân viên đang có đơn xin nghỉ liên quan, hãy xử lý đơn trước',
            );

        await ShiftRepository.cancelRegistration(registrationId);
    }

    // LỊCH TỔNG QUAN (calendar view)
    async getSchedule(start_date, end_date, userId = null) {
        if (!start_date || !end_date)
            throw new ErrorResponse(400, 'Thiếu start_date hoặc end_date');

        const rows = await ShiftRepository.findSchedule(start_date, end_date, userId);

        // Group theo nhân viên → ngày → danh sách ca
        const employeeMap = {};

        for (const row of rows) {
            const key = row.user_id;
            if (!employeeMap[key]) {
                employeeMap[key] = {
                    user_id: row.user_id,
                    name: `${row.first_name} ${row.last_name}`,
                    role: row.role_name,
                    schedule: {}, // { '2026-03-27': [{ registration_id, shift_id, template_name, start_time, end_time, display_status }] }
                };
            }

            const dateKey = formatDateStr(new Date(row.shift_date));
            if (!employeeMap[key].schedule[dateKey]) {
                employeeMap[key].schedule[dateKey] = [];
            }

            employeeMap[key].schedule[dateKey].push({
                registration_id: row.registration_id,
                shift_id: row.shift_id,
                template_id: row.template_id,
                template_name: row.template_name,
                start_time: row.start_time,
                end_time: row.end_time,
                display_status: row.display_status, // 'working' | 'on_leave' | 'pending_leave' | 'swapped_out' | 'swapped_in'
            });
        }

        return Object.values(employeeMap);
    }
}

module.exports = new ShiftService();