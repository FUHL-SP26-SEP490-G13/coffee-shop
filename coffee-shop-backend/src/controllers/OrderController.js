const OrderService = require("../services/OrderService");

class OrderController {
  async checkout(req, res, next) {
    try {
      const result = await OrderService.checkout(req.body, req.user || null);

      return res.status(201).json({
        success: true,
        data: result,
        message: "Đặt hàng thành công",
      });
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      next(error);
    }
  }

  async getMyOrders(req, res) {
    const userId = req.user.id;
    const result = await OrderService.getOrdersByUser(userId);

    return res.json({
      success: true,
      data: result,
      message: "Lấy danh sách đơn hàng thành công",
    });
  }

  async getMyOrderDetail(req, res) {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    const result = await OrderService.getOrderDetailByUser(orderId, userId);

    return res.json({
      success: true,
      data: result,
      message: "Lấy chi tiết đơn hàng thành công",
    });
  }
}

module.exports = new OrderController();
