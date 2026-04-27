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

}

module.exports = new TakeawayController();
