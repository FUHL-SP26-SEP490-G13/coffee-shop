const DashboardService = require("../services/DashboardService");
const response = require("../utils/response");

class DashboardController {
  async getOverview(req, res, next) {
    try {
      const data = await DashboardService.getOverview();
      return response.success(res, data, "Lấy dashboard thành công");
    } catch (error) {
      next(error);
    }
  }

  async getRevenueSeries(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const data = await DashboardService.getRevenueSeries({
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
      const data = await DashboardService.getTopProducts({
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
      const data = await DashboardService.getPaymentMethodBreakdown({
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
}

module.exports = new DashboardController();
