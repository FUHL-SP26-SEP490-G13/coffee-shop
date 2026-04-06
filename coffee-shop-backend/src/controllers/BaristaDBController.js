const service = require("../services/BaristaDBService");
const OrderRepository = require("../repositories/OrderRepository");

class BaristaDBController {
  async getOverview(req, res, next) {
    try {
      const data = await service.getOverview();

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req, res, next) {
    try {
      const hours = parseInt(req.query.hours, 10) || 6;
      const data = await service.getOrderTrends(hours);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getActiveOrders(req, res, next) {
    try {
      const statuses = String(req.query.statuses || "")
        .split(",")
        .map((status) => status.trim())
        .filter(Boolean);

      const data = await service.getActiveOrders(statuses);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDelayedOrders(req, res, next) {
    try {
      const minutes = parseInt(req.query.minutes, 10) || 15;
      const data = await service.getDelayedOrders(minutes);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTopProductsToday(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 5;
      const data = await service.getTopProductsToday(limit);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: "Thiếu trạng thái" });
      }

      await OrderRepository.updateOrderStatus(id, status);

      return res.json({
        success: true,
        message: "Cập nhật trạng thái thành công",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BaristaDBController();
