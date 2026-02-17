const VoucherService = require("../services/VoucherService");
const response = require("../utils/response");

class VoucherController {
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        code = "",
        status = "",
        type = "",
      } = req.query;

      const vouchers = await VoucherService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        code,
        status,
        type,
      });

      return response.success(res, vouchers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const voucher = await VoucherService.getById(req.params.id);
      return response.success(res, voucher);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await VoucherService.create(req.body);
      return response.success(res, { id }, "Tạo voucher thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      await VoucherService.update(req.params.id, req.body);
      return response.success(res, null, "Cập nhật thành công");
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await VoucherService.delete(req.params.id);
      return response.success(res, null, "Đã xóa");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoucherController();
