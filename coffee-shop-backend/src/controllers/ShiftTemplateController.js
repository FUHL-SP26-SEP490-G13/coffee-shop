const ShiftTemplateService = require('../services/ShiftTemplateService');

class ShiftTemplateController {
    async getAll(req, res, next) {
        try {
            const result = await ShiftTemplateService.getAll();
            return res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const result = await ShiftTemplateService.create(req.body);
            return res.status(201).json({
                success: true,
                data: result,
                message: 'Tạo ca làm việc thành công',
            });
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const result = await ShiftTemplateService.update(
                Number(req.params.id),
                req.body,
            );
            return res.json({
                success: true,
                data: result,
                message: 'Cập nhật ca làm việc thành công',
            });
        } catch (err) {
            next(err);
        }
    }

    async remove(req, res, next) {
        try {
            await ShiftTemplateService.remove(Number(req.params.id));
            return res.json({
                success: true,
                message: 'Xóa ca làm việc thành công',
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ShiftTemplateController();