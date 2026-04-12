const FlashSaleService = require("../services/FlashSaleService");
const response = require("../utils/response");
const ErrorResponse = require("../utils/ErrorResponse");

class FlashSaleController {
  async getCurrentActive(req, res, next) {
    try {
      const activeSale = await FlashSaleService.getCurrentActive();
      return response.success(
        res,
        activeSale,
        activeSale ? "Lấy flash sale hiện tại thành công" : "Hiện tại không có flash sale nào"
      );
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const sales = await FlashSaleService.getAll();
      return response.success(res, sales, "Lấy danh sách flash sale thành công");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = req.params.id;
      const sale = await FlashSaleService.getById(id);
      if (!sale) throw new ErrorResponse(404, "Không tìm thấy Flash Sale");
      return response.success(res, sale, "Lấy chi tiết thành công");
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = req.body;
      const newId = await FlashSaleService.create(data);
      return response.success(res, { id: newId }, "Tạo Flash Sale thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = req.params.id;
      const data = req.body;
      await FlashSaleService.update(id, data);
      return response.success(res, null, "Cập nhật Flash Sale thành công");
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = req.params.id;
      await FlashSaleService.delete(id);
      return response.success(res, null, "Xóa Flash Sale thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlashSaleController();
