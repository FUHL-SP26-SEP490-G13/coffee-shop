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
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getRevenueSeries({
        startDate,
        endDate,
      });
      return response.success(res, data, "Lấy biểu đồ doanh thu thành công");
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const { startDate, endDate, limit = 5 } = req.query;
      const data = await AdminDBService.getTopProducts({
        startDate,
        endDate,
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

  async getOrderTypeRevenue(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getOrderTypeRevenue({
        startDate,
        endDate,
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

  async getComparison(req, res, next) {
    try {
      const { startDate, endDate, prevStartDate, prevEndDate } = req.query;
      const data = await AdminDBService.getComparison({
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
      });
      return response.success(res, data, "So sánh kỳ trước thành công");
    } catch (err) {
      next(err);
    }
  }

  async getPaymentMethodRevenue(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getPaymentMethodRevenue({
        startDate,
        endDate,
      });
      return response.success(
        res,
        data,
        "Lấy doanh thu theo phương thức thanh toán thành công"
      );
    } catch (err) {
      next(err);
    }
  }

  async getOrdersSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getOrdersSummary({
        startDate,
        endDate,
      });
      return response.success(res, data, "Lấy tổng quan đơn hàng thành công");
    } catch (err) {
      next(err);
    }
  }

  async getDetailedOrdersReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getDetailedOrdersReport({
        startDate,
        endDate,
      });
      return response.success(res, data, "Lấy báo cáo chi tiết đơn hàng thành công");
    } catch (err) {
      next(err);
    }
  }

  async getShiftReport(req, res, next) {
    try {
      const { date } = req.query;
      // Default to today's date in YYYY-MM-DD format
      const reportDate = date || new Date().toISOString().slice(0, 10);
      const data = await AdminDBService.getShiftReport({ date: reportDate });
      return response.success(res, data, "Lấy báo cáo theo ca thành công");
    } catch (err) {
      next(err);
    }
  }

  async getProductReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AdminDBService.getProductReport({
        startDate,
        endDate,
      });
      return response.success(res, data, "Lấy báo cáo sản phẩm thành công");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminDBController();
