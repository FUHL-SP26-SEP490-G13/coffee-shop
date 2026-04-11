const CartService = require('../services/CartService');
const response = require('../utils/response');

class CartController {
  async getMyCart(req, res, next) {
    try {
      const data = await CartService.getCartByUser(req.user.id);
      return response.success(res, data, 'Lấy giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async replaceCart(req, res, next) {
    try {
      const data = await CartService.replaceCart(req.user.id, req.body || {});
      return response.success(res, data, 'Đồng bộ giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async mergeCart(req, res, next) {
    try {
      const data = await CartService.mergeCart(req.user.id, req.body || {});
      return response.success(res, data, 'Gộp giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();