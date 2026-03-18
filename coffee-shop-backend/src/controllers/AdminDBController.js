const AdminDBService = require("../services/AdminDBService");
const response = require("../utils/response");

class AdminDBController {
  async getOverview(req, res, next) {
    try {
      const data = await AdminDBService.getOverview();
      return response.success(res, data, "Lấy dashboard thành công");
    } catch (error) {
      next(error);
    }
  }

  async getRevenueSeries(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const data = await AdminDBService.getRevenueSeries({
        days: parseInt(days),
      });
      return response.success(res, data, "Lấy biểu đồ doanh thu thành công");
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const { days = 7, limit = 5 } = req.query;
      const data = await AdminDBService.getTopProducts({
        days: parseInt(days),
        limit: parseInt(limit),
      });
      return response.success(
        res,
        data,
        "Lấy top sản phẩm bán chạy thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethodBreakdown(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const data = await AdminDBService.getPaymentMethodBreakdown({
        days: parseInt(days),
      });
      return response.success(
        res,
        data,
        "Lấy doanh thu theo phương thức thanh toán thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  async getOrderTypeRevenue(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const data = await AdminDBService.getOrderTypeRevenue({
        days: parseInt(days),
      });
      return response.success(
        res,
        data,
        "Lấy doanh thu theo loại đơn thành công"
      );
    } catch (err) {
      next(err);
    }
  }

  // Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
  async getComparison(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const data = await AdminDBService.getComparison({
        days: parseInt(days),
      });
      return response.success(res, data, "So sánh kỳ trước thành công");
    } catch (err) {
      next(err);
    }
  }

  // Optional: tóm tắt số lượng nhân viên theo vai trò (barista, phục vụ, quản lý) để dashboard có thêm vài số liệu hữu ích
  async getStaffSummary(req, res) {
    try {
      const data = await AdminDBService.getStaffSummary();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("getStaffSummary error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  async getTableStatus(req, res, next) {
    try {
      const data = await AdminDBService.getTableStatus();

      return response.success(res, data, "Lấy trạng thái bàn thành công");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminDBController();
