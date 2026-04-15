const ShiftRepository = require('../repositories/ShiftRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const validateDate = require('../helpers/validateDate');
const formatDateStr = require('../helpers/formatDateStr');

class ShiftService {
    // HELPER
    timeToMinutes(timeStr) {
        const [hour, minute] = String(timeStr).slice(0, 5).split(':').map(Number);
        return hour * 60 + minute;
    }

    // Biến 1 ca thành 1 hoặc 2 đoạn thời gian trong ngày
    // Ví dụ:
    // 08:00-12:00 => [[480, 720]]
    // 22:00-02:00 => [[1320, 1440], [0, 120]]
    splitShiftToRanges(startTime, endTime) {
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);

        // Ca trong ngày
        if (end > start) {
            return [[start, end]];
        }

        // Ca qua đêm
        return [
            [start, 1440],
            [0, end],
        ];
    }

    // Kiểm tra 2 ca có trùng giờ không
    isTimeOverlap(startA, endA, startB, endB) {
        const rangesA = this.splitShiftToRanges(startA, endA);
        const rangesB = this.splitShiftToRanges(startB, endB);

        for (const [aStart, aEnd] of rangesA) {
            for (const [bStart, bEnd] of rangesB) {
                if (aStart < bEnd && aEnd > bStart) {
                    return true;
                }
            }
        }

        return false;
    }

    async assignSingle({ date, user_id, template_id }) {
        validateDate(date);

        if (!user_id) {
            throw new ErrorResponse(400, 'Thiếu user_id');
        }

        if (!template_id) {
            throw new ErrorResponse(400, 'Thiếu template_id');
        }

        const [year, month, day] = date.split('-').map(Number);
        const assignDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (assignDate < today) {
            throw new ErrorResponse(400, 'Không thể gán ca cho ngày trong quá khứ');
        }

        const template = await ShiftRepository.findTemplateById(template_id);
        if (!template) {
            throw new ErrorResponse(404, 'Ca làm việc không tồn tại');
        }

        const user = await ShiftRepository.findUserById(user_id);
        if (!user) {
            throw new ErrorResponse(404, 'Nhân viên không tồn tại');
        }

        if (!user.isActive) {
            throw new ErrorResponse(400, 'Nhân viên đã ngừng hoạt động');
        }

        if (!['staff', 'barista'].includes(user.role_name?.toLowerCase())) {
            throw new ErrorResponse(
                400,
                `Chỉ có thể gán ca cho nhân viên (staff/barista), không gán cho ${user.role_name}`,
            );
        }

        // Tạo hoặc lấy shift slot của ngày đó
        const shift = await ShiftRepository.findOrCreateShift(template_id, date);

        // 1. Check trùng giờ với các ca khác của user trong cùng ngày
        const existingShifts = await ShiftRepository.findUserShiftsOnDate(user_id, date);

        for (const existingShift of existingShifts) {
            // Cùng template thì để duplicate registration xử lý bên dưới
            if (existingShift.template_id === template_id) {
                continue;
            }

            const isOverlap = this.isTimeOverlap(
                template.start_time,
                template.end_time,
                existingShift.start_time,
                existingShift.end_time,
            );

            if (isOverlap) {
                throw new ErrorResponse(
                    400,
                    `${user.first_name} ${user.last_name} đã có ${existingShift.template_name} ` +
                    `(${existingShift.start_time.slice(0, 5)}–${existingShift.end_time.slice(0, 5)}) ` +
                    `trùng giờ với ${template.name}` +
                    `(${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)}) ` +
                    `ngày ${date}`,
                );
            }
        }

        // 2. Check nhân viên đã có registration ở đúng shift này chưa
        const existingRegistration = await ShiftRepository.findRegistration(user_id, shift.id);

        if (existingRegistration && existingRegistration.status !== 'cancelled') {
            throw new ErrorResponse(
                400,
                `${user.first_name} ${user.last_name} đã được phân vào ${template.name} ngày ${date}`,
            );
        }

        // 3. Nếu là staff -> mỗi ca chỉ có 1 staff
        if (user.role_name?.toLowerCase() === 'staff') {
            const existingStaff = await ShiftRepository.findStaffInShift(shift.id);

            const isReactivatingSameRegistration =
                existingRegistration &&
                existingRegistration.status === 'cancelled' &&
                existingStaff &&
                existingStaff.id === existingRegistration.id;

            if (existingStaff && !isReactivatingSameRegistration) {
                throw new ErrorResponse(
                    400,
                    `${template.name} ngày ${date} đã có ${existingStaff.first_name} ${existingStaff.last_name} phụ trách. Mỗi ca chỉ được có 1 staff.`,
                );
            }
        }

        // 4. Tạo mới hoặc khôi phục registration
        let registration;
        if (existingRegistration && existingRegistration.status === 'cancelled') {
            registration = await ShiftRepository.reactivateRegistration(existingRegistration.id);
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

    // days_of_week: 0=CN, 1=T2, ..., 6=T7
    async assignBulk({ start_date, weeks, assignments }) {
        validateDate(start_date, false);

        if (!weeks || weeks < 1 || weeks > 12) {
            throw new ErrorResponse(400, 'Số tuần phải từ 1 đến 12');
        }

        const [year, month, day] = start_date.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            throw new ErrorResponse(400, 'Ngày bắt đầu gán ca không được trong quá khứ');
        }

        if (!Array.isArray(assignments) || assignments.length === 0) {
            throw new ErrorResponse(400, 'Danh sách gán ca trống');
        }

        // 1. Validate input
        for (const item of assignments) {
            if (!item.user_id || !item.template_id || !Array.isArray(item.days_of_week)) {
                throw new ErrorResponse(400, 'Dữ liệu gán ca không hợp lệ');
            }

            if (item.days_of_week.length === 0) {
                throw new ErrorResponse(400, 'days_of_week không được rỗng');
            }

            for (const dayOfWeek of item.days_of_week) {
                if (dayOfWeek < 0 || dayOfWeek > 6) {
                    throw new ErrorResponse(400, 'days_of_week phải từ 0 (CN) đến 6 (T7)');
                }
            }
        }

        //
        const userMap = {};
        const templateMap = {};

        for (const item of assignments) {
            if (!userMap[item.user_id]) {
                const user = await ShiftRepository.findUserById(item.user_id);

                if (!user) {
                    throw new ErrorResponse(404, `Nhân viên id=${item.user_id} không tồn tại`);
                }

                if (!user.isActive) {
                    throw new ErrorResponse(400, `Nhân viên id=${item.user_id} đã ngừng hoạt động`);
                }

                if (!['staff', 'barista'].includes(user.role_name?.toLowerCase())) {
                    throw new ErrorResponse(
                        400,
                        `${user.first_name} ${user.last_name} có vai trò ${user.role_name}, chỉ gán ca cho staff/barista`,
                    );
                }

                userMap[item.user_id] = user;
            }

            if (!templateMap[item.template_id]) {
                const template = await ShiftRepository.findTemplateById(item.template_id);

                if (!template) {
                    throw new ErrorResponse(404, `Ca id=${item.template_id} không tồn tại`);
                }

                templateMap[item.template_id] = template;
            }
        }

        const totalDays = weeks * 7;
        const plan = [];

        // Cache các ca active của từng user trong từng ngày
        const userDayShiftCache = {};
        // Dùng object thường thay vì Set cho dễ hiểu
        const staffBatchMap = {};

        const getUserShiftsInDay = async (userId, dateStr) => {
            const cacheKey = `${userId}_${dateStr}`;

            if (!userDayShiftCache[cacheKey]) {
                userDayShiftCache[cacheKey] = await ShiftRepository.findUserShiftsOnDate(userId, dateStr);
            }

            return userDayShiftCache[cacheKey];
        };

        // 3. Validate toàn bộ trước
        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayOffset);

            const currentDayOfWeek = currentDate.getDay();
            const dateStr = formatDateStr(currentDate);

            for (const item of assignments) {
                if (!item.days_of_week.includes(currentDayOfWeek)) {
                    continue;
                }

                const user = userMap[item.user_id];
                const template = templateMap[item.template_id];

                // 3.1 Check overlap
                const existingShifts = await getUserShiftsInDay(item.user_id, dateStr);

                for (const existingShift of existingShifts) {
                    // Cùng template thì để duplicate registration xử lý bên dưới
                    if (existingShift.template_id === item.template_id) {
                        continue;
                    }

                    const isOverlap = this.isTimeOverlap(
                        template.start_time,
                        template.end_time,
                        existingShift.start_time,
                        existingShift.end_time,
                    );

                    if (isOverlap) {
                        throw new ErrorResponse(
                            400,
                            `${user.first_name} ${user.last_name} đã có ${existingShift.template_name} ` +
                            `(${existingShift.start_time.slice(0, 5)}–${existingShift.end_time.slice(0, 5)}) ` +
                            `trùng giờ với ${template.name} ` +
                            `(${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)}) ` +
                            `ngày ${dateStr}`,
                        );
                    }
                }

                // 3.2 Tìm shift slot hiện có
                const existingShiftSlot = await ShiftRepository.findShiftSlot(
                    item.template_id,
                    dateStr,
                );

                let existingRegistration = null;
                if (existingShiftSlot) {
                    existingRegistration = await ShiftRepository.findRegistration(
                        item.user_id,
                        existingShiftSlot.id,
                    );
                }

                if (existingRegistration && existingRegistration.status !== 'cancelled') {
                    throw new ErrorResponse(
                        400,
                        `${user.first_name} ${user.last_name} đã được phân vào ${template.name} ngày ${dateStr}`,
                    );
                }

                // 3.3 Nếu là staff -> mỗi ca chỉ có 1 staff
                if (user.role_name?.toLowerCase() === 'staff') {
                    if (existingShiftSlot) {
                        const existingStaff = await ShiftRepository.findStaffInShift(existingShiftSlot.id);

                        const isReactivatingSameRegistration =
                            existingRegistration &&
                            existingRegistration.status === 'cancelled' &&
                            existingStaff &&
                            existingStaff.id === existingRegistration.id;

                        if (existingStaff && !isReactivatingSameRegistration) {
                            throw new ErrorResponse(
                                400,
                                `${template.name} ngày ${dateStr} đã có ${existingStaff.first_name} ${existingStaff.last_name} phụ trách. Mỗi ca chỉ được có 1 staff.`,
                            );
                        }
                    }

                    const staffBatchKey = `${item.template_id}_${dateStr}`;
                    if (staffBatchMap[staffBatchKey]) {
                        throw new ErrorResponse(
                            400,
                            `${template.name} ngày ${dateStr} đã được gán cho staff ${staffBatchMap[staffBatchKey]} trong lần gán này. Mỗi ca chỉ được có 1 staff.`,
                        );
                    }

                    staffBatchMap[staffBatchKey] = `${user.first_name} ${user.last_name}`;
                }

                // 3.4 Lưu kế hoạch để pass 2 thực thi
                plan.push({
                    user,
                    template,
                    dateStr,
                    existingShiftSlot,
                    existingRegistration,
                });

                // 3.5 Cập nhật cache để check overlap trong chính batch này
                const cacheKey = `${item.user_id}_${dateStr}`;
                if (!userDayShiftCache[cacheKey]) {
                    userDayShiftCache[cacheKey] = [];
                }

                userDayShiftCache[cacheKey].push({
                    template_id: template.id,
                    template_name: template.name,
                    start_time: template.start_time,
                    end_time: template.end_time,
                });
            }
        }

        // 4. Thực thi insert/reactivate
        const results = [];

        for (const row of plan) {
            const user = row.user;
            const template = row.template;
            const dateStr = row.dateStr;
            const existingShiftSlot = row.existingShiftSlot;
            const existingRegistration = row.existingRegistration;

            const shift =
                existingShiftSlot ||
                await ShiftRepository.findOrCreateShift(template.id, dateStr);

            let registration;
            if (existingRegistration && existingRegistration.status === 'cancelled') {
                registration = await ShiftRepository.reactivateRegistration(existingRegistration.id);
            } else {
                registration = await ShiftRepository.createRegistration(user.id, shift.id);
            }

            results.push({
                registration_id: registration.id,
                shift_id: shift.id,
                date: dateStr,
                template: {
                    id: template.id,
                    name: template.name,
                    start_time: template.start_time,
                    end_time: template.end_time,
                    color: template.color,
                },
                user: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                },
                status: registration.status,
            });
        }

        return {
            total: results.length,
            details: results,
        };
    }

    async removeRegistration(registrationId) {
        const reg = await ShiftRepository.findRegistrationById(registrationId);
        if (!reg) {
            throw new ErrorResponse(404, 'Không tìm thấy lịch làm việc này');
        }

        await ShiftRepository.cancelRegistration(registrationId);
    }


    // LỊCH TỔNG QUAN (calendar view)
    async getSchedule(start_date, end_date, userId = null) {
        if (!start_date || !end_date) {
            throw new ErrorResponse(400, 'Thiếu start_date hoặc end_date');
        }

        const rows = await ShiftRepository.findSchedule(start_date, end_date, userId);

        const employeeMap = {};

        for (const row of rows) {
            const userKey = row.user_id;

            if (!employeeMap[userKey]) {
                employeeMap[userKey] = {
                    user_id: row.user_id,
                    name: `${row.first_name} ${row.last_name}`,
                    role: row.role_name,
                    schedule: {},
                };
            }

            const dateKey =
                typeof row.shift_date === 'string'
                    ? row.shift_date.slice(0, 10)
                    : formatDateStr(row.shift_date);

            if (!employeeMap[userKey].schedule[dateKey]) {
                employeeMap[userKey].schedule[dateKey] = [];
            }

            employeeMap[userKey].schedule[dateKey].push({
                registration_id: row.registration_id,
                shift_id: row.shift_id,
                template_id: row.template_id,
                template_name: row.template_name,
                start_time: row.start_time,
                end_time: row.end_time,
                color: row.color,
            });
        }

        return Object.values(employeeMap);
    }
}

module.exports = new ShiftService();