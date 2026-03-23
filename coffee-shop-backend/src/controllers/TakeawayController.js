const TakeawayService = require('../services/TakeawayService');

class TakeawayController {
  // POST /takeaway/orders
  async createOrder(req, res, next) {
    try {
      const result = await TakeawayService.createTakeawayOrder(
        req.body,
        req.user,
      );
      return res
        .status(201)
        .json({ success: true, data: result, message: 'Tạo đơn thành công' });
    } catch (err) {
      next(err);
    }
  }

  // PUT /takeaway/orders/:id
  async updateOrder(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.updateTakeawayOrder(
        orderId,
        req.body,
        req.user,
      );
      return res.json({
        success: true,
        data: result,
        message: 'Cập nhật đơn thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /takeaway/orders/:id/cancel
  async cancelOrder(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.cancelTakeawayOrder(
        orderId,
        req.user,
      );
      return res.json({
        success: true,
        data: result,
        message: 'Hủy đơn thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /takeaway/orders/:id/payos-link
  async createPayosLink(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.createPayosLink(orderId, req.user);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /takeaway/orders/:id/receipt
  async getReceipt(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.getReceipt(orderId);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /takeaway/orders/:id/assign  (barista nhận đơn)
  async assignOrder(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.assignToBarista(orderId, req.user);
      return res.json({
        success: true,
        data: result,
        message: 'Nhận đơn thành công',
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /takeaway/orders/:id/served  (barista làm xong)
  async markServed(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.markServedByBarista(
        orderId,
        req.user,
      );
      return res.json({
        success: true,
        data: result,
        message: 'Đơn đã hoàn thành',
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /takeaway/orders/:id/complete  (staff giao khách)
  async markCompleted(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await TakeawayService.markCompleted(orderId, req.user);
      return res.json({
        success: true,
        data: result,
        message: 'Giao hàng thành công',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TakeawayController();
