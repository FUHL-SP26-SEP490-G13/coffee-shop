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

        // Ngày gán ca không được trong quá khứ
        const [y, m, d] = date.split('-').map(Number);
        const assignDate = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (assignDate < today) {
            throw new ErrorResponse(400, 'Không thể gán ca cho ngày trong quá khứ');
        }

        // Ngày gán ca phải cách hiện tại ít nhất 1 ngày
        // const minDate = new Date(today);
        // minDate.setDate(today.getDate() + 1);
        // if (assignDate < minDate) {
        //     const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
        //     throw new ErrorResponse(
        //         400,
        //         `Chỉ được gán ca trước ít nhất 1 ngày. Ngày sớm nhất có thể gán: ${minDateStr}`,
        //     );
        // }

        const template = await ShiftRepository.findTemplateById(template_id);
        if (!template) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

        const user = await ShiftRepository.findUserById(user_id);
        if (!user) throw new ErrorResponse(404, 'Nhân viên không tồn tại');
        if (!user.isActive) throw new ErrorResponse(400, 'Nhân viên đã ngừng hoạt động');
        if (!['staff', 'barista'].includes(user.role_name?.toLowerCase()))
            throw new ErrorResponse(400, `Chỉ có thể gán ca cho nhân viên (staff/barista), không gán cho ${user.role_name}`);

        // findOrCreate shift (slot ca của ngày đó)
        const shift = await ShiftRepository.findOrCreateShift(template_id, date);

        // Check overlap giờ làm trong ngày (bỏ qua shift cùng template — sẽ bị bắt ở bước duplicate check)
        const existingShifts = await ShiftRepository.findUserShiftsOnDate(user_id, date);
        const toMins = (hhmm) => { const [h, m] = hhmm.slice(0, 5).split(':').map(Number); return h * 60 + m; };
        const newStart = toMins(template.start_time);
        const newEnd = toMins(template.end_time);

        for (const s of existingShifts) {
            if (s.template_id === template_id) continue; // cùng ca → để duplicate check xử lý
            const sStart = toMins(s.start_time);
            const sEnd = toMins(s.end_time);
            if (newStart < sEnd && newEnd > sStart) {
                throw new ErrorResponse(
                    400,
                    `${user.first_name} ${user.last_name} đã có ca "${s.template_name}" ` +
                    `(${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}) ` +
                    `trùng giờ với ca "${template.name}" ` +
                    `(${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)}) ` +
                    `ngày ${date}`,
                );
            }
        }

        // Kiểm tra nhân viên đã được gán ca này chưa
        const existing = await ShiftRepository.findRegistration(user_id, shift.id);

        if (existing && existing.status !== 'cancelled')
            throw new ErrorResponse(
                400,
                `${user.first_name} ${user.last_name} đã được phân vào ${template.name} ngày ${date}`,
            );

        // Nếu đã có nhưng bị cancelled thủ công → reactivate
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

        if (!weeks || weeks < 1 || weeks > 12) {
            throw new ErrorResponse(400, 'Số tuần phải từ 1 đến 12');
        }

        // start_date không được trong quá khứ
        const [sy0, sm0, sd0] = start_date.split('-').map(Number);
        const startDateObj = new Date(sy0, sm0 - 1, sd0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDateObj < today) {
            throw new ErrorResponse(400, 'Ngày bắt đầu gán ca không được trong quá khứ');
        }

        // start_date phải cách hôm nay ít nhất 2 ngày
        // const minDate = new Date(today);
        // minDate.setDate(today.getDate() + 2);
        // if (startDateObj < minDate) {
        //     // dùng local time để tránh lệch một ngày do toISOString() đổi sang UTC
        //     const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
        //     throw new ErrorResponse(
        //         400,
        //         `Ngày bắt đầu gán ca phải cách hôm nay ít nhất 2 ngày. Ngày sớm nhất: ${minDateStr}`,
        //     );
        // }

        if (!Array.isArray(assignments) || assignments.length === 0) {
            throw new ErrorResponse(400, 'Danh sách gán ca trống');
        }

        // Validate cấu trúc từng assignment
        for (const a of assignments) {
            if (!a.user_id || !a.template_id || !Array.isArray(a.days_of_week)) {
                throw new ErrorResponse(400, 'Dữ liệu gán ca không hợp lệ');
            }

            if (a.days_of_week.length === 0) {
                throw new ErrorResponse(400, 'days_of_week không được rỗng');
            }

            if (a.days_of_week.some((d) => d < 0 || d > 6)) {
                throw new ErrorResponse(400, 'days_of_week phải từ 0 (CN) đến 6 (T7)');
            }
        }

        // Lấy danh sách user/template unique
        const uniqueUserIds = [...new Set(assignments.map((a) => a.user_id))];
        const uniqueTemplateIds = [...new Set(assignments.map((a) => a.template_id))];

        const [users, templates] = await Promise.all([
            Promise.all(uniqueUserIds.map((id) => ShiftRepository.findUserById(id))),
            Promise.all(uniqueTemplateIds.map((id) => ShiftRepository.findTemplateById(id))),
        ]);

        const userMap = new Map(uniqueUserIds.map((id, i) => [id, users[i]]));
        const templateMap = new Map(uniqueTemplateIds.map((id, i) => [id, templates[i]]));

        // Validate user/template tồn tại
        for (const a of assignments) {
            const user = userMap.get(a.user_id);
            if (!user) {
                throw new ErrorResponse(404, `Nhân viên id=${a.user_id} không tồn tại`);
            }

            if (!user.isActive) {
                throw new ErrorResponse(400, `Nhân viên id=${a.user_id} đã ngừng hoạt động`);
            }

            if (!['staff', 'barista'].includes(user.role_name?.toLowerCase())) {
                throw new ErrorResponse(
                    400,
                    `${user.first_name} ${user.last_name} có vai trò ${user.role_name}, chỉ gán ca cho staff/barista`,
                );
            }

            const template = templateMap.get(a.template_id);
            if (!template) {
                throw new ErrorResponse(404, `Ca id=${a.template_id} không tồn tại`);
            }
        }

        // Parse local date để tránh lệch ngày do timezone
        const [sy, sm, sd] = start_date.split('-').map(Number);
        const startDate = new Date(sy, sm - 1, sd);
        const totalDays = weeks * 7;

        // Helper đổi HH:MM[:SS] → phút
        const toMins = (hhmm) => {
            const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
            return h * 60 + m;
        };

        /**
         * Lưu ý: vòng lặp chạy từ start_date đi tới (dayOffset: 0 → totalDays-1).
         * Nếu start_date giữa tuần (ví dụ 13/5 = Thứ 4), các ngày T2/T3 trong tuần
         * đó (11/5, 12/5) sẽ không bị xử lý vì chúng trước start_date.
         * T2/T3 gần nhất được gán sẽ là 18/5 và 19/5 (tuần tiếp theo).
         */

        const plan = []; // { user, template, dateStr, existingShiftSlot, existingReg }

        const shiftCache = new Map();
        const getUserShifts = async (userId, dateStr) => {
            const key = `${userId}_${dateStr}`;
            if (!shiftCache.has(key)) {
                const rows = await ShiftRepository.findUserShiftsOnDate(userId, dateStr);
                shiftCache.set(key, rows || []);
            }
            return shiftCache.get(key);
        };

        // VALIDATE TOÀN BỘ
        for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + dayOffset);
            const dayOfWeek = currentDate.getDay();
            const dateStr = formatDateStr(currentDate);

            for (const assignment of assignments) {
                if (!assignment.days_of_week.includes(dayOfWeek)) continue;

                const user = userMap.get(assignment.user_id);
                const template = templateMap.get(assignment.template_id);
                const newStart = toMins(template.start_time);
                const newEnd = toMins(template.end_time);

                // 1a) Check overlap với các ca KHÁC trong ngày
                // (bỏ qua shift cùng template_id — sẽ bị bắt ở bước duplicate check với message rõ hơn)
                const existingShifts = await getUserShifts(assignment.user_id, dateStr);
                for (const s of existingShifts) {
                    if (s.template_id === assignment.template_id) continue;
                    if (newStart < toMins(s.end_time) && newEnd > toMins(s.start_time)) {
                        throw new ErrorResponse(
                            400,
                            `${user.first_name} ${user.last_name} đã có ca "${s.template_name}" ` +
                            `(${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}) ` +
                            `trùng giờ với ca "${template.name}" ` +
                            `(${template.start_time.slice(0, 5)}–${template.end_time.slice(0, 5)}) ` +
                            `ngày ${dateStr}`,
                        );
                    }
                }

                // 1b) Tìm shift slot & registration đã có (chỉ tìm, không tạo)
                const existingShiftSlot = await ShiftRepository.findShiftSlot(
                    assignment.template_id, dateStr,
                );
                let existingReg = null;
                if (existingShiftSlot) {
                    existingReg = await ShiftRepository.findRegistration(
                        assignment.user_id, existingShiftSlot.id,
                    );
                }

                // 1c) Validate trạng thái registration
                if (existingReg && existingReg.status !== 'cancelled') {
                    throw new ErrorResponse(
                        400,
                        `${user.first_name} ${user.last_name} đã được phân vào ${template.name} ngày ${dateStr}`,
                    );
                }

                // Ghi nhớ để thực thi ở Pass 2
                plan.push({ user, template, dateStr, existingShiftSlot, existingReg });

                // Cập nhật cache để check overlap trong cùng batch
                const cacheKey = `${assignment.user_id}_${dateStr}`;
                if (!shiftCache.has(cacheKey)) shiftCache.set(cacheKey, []);
                shiftCache.get(cacheKey).push({
                    start_time: template.start_time,
                    end_time: template.end_time,
                    template_name: template.name,
                });
            }
        }

        const results = [];
        for (const { user, template, dateStr, existingShiftSlot, existingReg } of plan) {
            // Tạo shift slot nếu chưa có
            const shift = existingShiftSlot
                ?? await ShiftRepository.findOrCreateShift(template.id, dateStr);

            // Tạo hoặc khôi phục registration
            let registration;
            if (existingReg && existingReg.status === 'cancelled') {
                registration = await ShiftRepository.reactivateRegistration(existingReg.id);
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


    // XÓA NHÂN VIÊN KHỎI CA
    async removeRegistration(registrationId) {
        const reg = await ShiftRepository.findRegistrationById(registrationId);
        if (!reg) throw new ErrorResponse(404, 'Không tìm thấy lịch làm việc này');

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
                    schedule: {}, // { '2026-03-27': [{ registration_id, shift_id, template_name, start_time, end_time }] }
                };
            }

            // Slice trực tiếp từ string 'YYYY-MM-DD' hoặc 'YYYY-MM-DDTHH:...' để tránh timezone issue
            const dateKey = typeof row.shift_date === 'string'
                ? row.shift_date.slice(0, 10)
                : formatDateStr(row.shift_date);
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
                color: row.color,
            });
        }

        return Object.values(employeeMap);
    }

}

module.exports = new ShiftService();