const ShiftService = require('../services/ShiftService');

class ShiftController {
    // Body: { date, user_id, template_id }
    async assignSingle(req, res, next) {
        try {
            const result = await ShiftService.assignSingle(req.body);
            return res.status(201).json({
                success: true,
                data: result,
                message: 'Gán ca thành công',
            });
        } catch (err) {
            next(err);
        }
    }

    // Body: { start_date, weeks, assignments: [{ user_id, template_id, days_of_week: [1,2,3,4,5] }] }
    async assignBulk(req, res, next) {
        try {
            const result = await ShiftService.assignBulk(req.body);
            return res.status(201).json({
                success: true,
                data: result,
                message: `Đã gán ${result.total} ca thành công`,
            });
        } catch (err) {
            next(err);
        }
    }

    // DELETE /shifts/registrations/:id
    async removeRegistration(req, res, next) {
        try {
            await ShiftService.removeRegistration(Number(req.params.id));
            return res.json({
                success: true,
                message: 'Đã xóa nhân viên khỏi lịch làm việc',
            });
        } catch (err) {
            next(err);
        }
    }

    // GET /shifts/schedule?start_date=2026-03-23&end_date=2026-03-29
    async getSchedule(req, res, next) {
        try {
            const { start_date, end_date } = req.query;
            const result = await ShiftService.getSchedule(start_date, end_date);
            return res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    // GET /shifts/schedule/me?start_date=...&end_date=...
    async getMySchedule(req, res, next) {
        try {
            const { start_date, end_date } = req.query;
            const result = await ShiftService.getSchedule(
                start_date,
                end_date,
                req.user.id,
            );
            return res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ShiftController();