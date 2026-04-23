const service = require("../services/BaristaDBService");
const OrderRepository = require("../repositories/OrderRepository");
const OrderOnlineService = require("../services/OrderOnlineService");

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

      const filters = {};
      if (req.query.startDate && req.query.endDate) {
        filters.startDate = req.query.startDate;
        filters.endDate = req.query.endDate;
      } else if (req.query.today === 'true') {
        filters.today = true;
      }

      const data = await service.getActiveOrders(statuses, filters);

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

      const order = await OrderRepository.findOrderById(id);

      await OrderRepository.updateOrderStatus(id, status);

      if (status === 'completed') {
        if (order && order.order_type === 'delivery') {
          await OrderRepository.updateOrderPaidStatus(id, true);
          await OrderRepository.updatePaymentByOrderCode(id, { payment_status: 'paid' });
          await OrderOnlineService.syncCompletionRewardsForDelivery(id);
        }
      }

      // Emit socket event để các tab khác (quản lý đơn hàng, cửa sổ pha chế) tự cập nhật
      const io = req.app.get("io");
      if (io) {
        io.emit("order:status-updated", {
          order_id: Number(id),
          status,
          order_type: order?.order_type,
          updated_at: new Date().toISOString(),
        });
      }

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
