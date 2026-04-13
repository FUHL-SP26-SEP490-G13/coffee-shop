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

  async validateDiscount(req, res, next) {
    try {
      const { code, order_amount } = req.body;

      const result = await OrderService.validateDiscount(code, order_amount);

      return res.json({
        success: true,
        data: result,
        message: "Áp dụng mã giảm giá thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res) {
    const userId = req.user.id || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để xem đơn hàng",
      });
    }
    
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

  async payosReturn(req, res, next) {
    try {
      const { orderCode, payosId, status, cancel } = req.body;
      const result = await OrderService.savePayosReturn({ orderCode, payosId, status, cancel });
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
//admin
  async getAllOrders(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status = "all",
        order_type = "all",
        order_code = "",
        start_date = "",
        end_date = "",
      } = req.query;

      const result = await OrderService.getAllOrders({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        status,
        order_type,
        order_code,
        start_date,
        end_date,
      });

      return res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
        message: "Lấy danh sách đơn hàng toàn hệ thống thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetailByStaff(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const result = await OrderService.getOrderDetail(orderId);

      return res.json({
        success: true,
        data: result,
        message: "Lấy chi tiết đơn hàng (staff) thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderItems(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const { items } = req.body;
      const result = await OrderService.updateOrderItems(orderId, items);
      return res.json({
        success: true,
        data: result,
        message: 'Cập nhật đơn hàng thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
