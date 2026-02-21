const DiscountService = require("../services/DiscountService");
const response = require("../utils/response");

class DiscountController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 6, code = "", status = "" } = req.query;

      const discounts = await DiscountService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        code,
        status,
      });

      return response.success(res, discounts);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const discount = await DiscountService.getById(req.params.id);
      return response.success(res, discount);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const id = await DiscountService.create(req.body);
      return response.success(res, { id }, "Tạo discount thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      await DiscountService.update(req.params.id, req.body);
      return response.success(res, null, "Cập nhật thành công");
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await DiscountService.delete(req.params.id);
      return response.success(res, null, "Đã xóa");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DiscountController();
