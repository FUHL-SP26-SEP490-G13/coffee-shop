const ShiftRepository = require('../repositories/ShiftRepository');
const ErrorResponse = require('../utils/ErrorResponse');

const VALID_COLORS = [
    'red',
    'orange',
    'yellow',
    'green',
    'emerald',
    'teal',
    'blue',
    'indigo',
    'purple'
];
const MIN_SHIFT_MINUTES = 120; // Ca tối thiểu 2 tiếng
const MIN_SHIFT_HOURS = MIN_SHIFT_MINUTES / 60;
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };


class ShiftTemplateService {
    async getAll() {
        return ShiftRepository.findAllTemplates();
    }

    async create({ name, start_time, end_time, color }) {
        if (!name?.trim()) throw new ErrorResponse(400, 'Thiếu tên ca');
        if (!start_time) throw new ErrorResponse(400, 'Thiếu giờ bắt đầu');
        if (!end_time) throw new ErrorResponse(400, 'Thiếu giờ kết thúc');

        if (color && !VALID_COLORS.includes(color))
            throw new ErrorResponse(400, `Màu không hợp lệ`);

        // Validate time format HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time))
            throw new ErrorResponse(400, 'Định dạng giờ không hợp lệ');

        if (start_time >= end_time)
            throw new ErrorResponse(400, 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc');

        if (toMinutes(end_time) - toMinutes(start_time) < MIN_SHIFT_MINUTES)
            throw new ErrorResponse(400, `Ca làm việc phải dài ít nhất ${MIN_SHIFT_HOURS} tiếng`);

        const existing = await ShiftRepository.findTemplateByName(name.trim());
        if (existing)
            throw new ErrorResponse(400, `"${name.trim()}" đã tồn tại`);

        const usedColor = await ShiftRepository.findTemplateByColor(color || 'blue');
        if (usedColor)
            throw new ErrorResponse(400, `Màu đã được dùng cho ca khác`);

        // Kiểm tra trùng khung giờ với ca khác
        const overlapping = await ShiftRepository.findOverlappingTemplate(start_time, end_time);
        if (overlapping)
            throw new ErrorResponse(400, `Khung giờ bị trùng với ca khác`);

        return ShiftRepository.createTemplate({
            name: name.trim().toUpperCase(),
            start_time,
            end_time,
            color: color || 'blue',
        });
    }

    async update(id, { name, start_time, end_time, color }) {
        const template = await ShiftRepository.findTemplateById(id);
        if (!template) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

        if (name?.trim() && name.trim() !== template.name) {
            const existing = await ShiftRepository.findTemplateByName(name.trim());
            if (existing && existing.id !== id)
                throw new ErrorResponse(400, `Ca "${name.trim()}" đã tồn tại`);
        }

        if (color) {
            if (!VALID_COLORS.includes(color))
                throw new ErrorResponse(400, `Màu không hợp lệ`);
            if (color !== template.color) {
                const usedColor = await ShiftRepository.findTemplateByColor(color);
                if (usedColor && usedColor.id !== id)
                    throw new ErrorResponse(400, `Màu ${color} đã được dùng cho ca khác`);
            }
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (start_time && !timeRegex.test(start_time))
            throw new ErrorResponse(400, 'Định dạng giờ bắt đầu không hợp lệ');
        if (end_time && !timeRegex.test(end_time))
            throw new ErrorResponse(400, 'Định dạng giờ kết thúc không hợp lệ');

        const finalStart = start_time ?? template.start_time;
        const finalEnd = end_time ?? template.end_time;

        if (finalStart >= finalEnd)
            throw new ErrorResponse(400, 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc');

        if (toMinutes(finalEnd) - toMinutes(finalStart) < MIN_SHIFT_MINUTES)
            throw new ErrorResponse(400, `Ca làm việc phải dài ít nhất ${MIN_SHIFT_HOURS} tiếng`);

        // Kiểm tra trùng khung giờ với ca khác (trừ chính nó)
        const overlapping = await ShiftRepository.findOverlappingTemplate(finalStart, finalEnd, id);
        if (overlapping)
            throw new ErrorResponse(400, `Khung giờ bị trùng với ca khác`);

        return ShiftRepository.updateTemplate(id, {
            name: name?.trim().toUpperCase() ?? template.name.toUpperCase(),
            start_time: finalStart,
            end_time: finalEnd,
            color: color ?? template.color,
        });
    }

    async remove(id) {
        const template = await ShiftRepository.findTemplateById(id);
        if (!template) throw new ErrorResponse(404, 'Ca làm việc không tồn tại');

        // Kiểm tra có shifts đang dùng template này không
        const usageCount = await ShiftRepository.countShiftsByTemplate(id);
        if (usageCount > 0)
            throw new ErrorResponse(
                400,
                `Không thể xóa ca này vì đang được dùng trong ${usageCount} lịch làm việc`,
            );

        await ShiftRepository.deleteTemplate(id);
    }
}

module.exports = new ShiftTemplateService();