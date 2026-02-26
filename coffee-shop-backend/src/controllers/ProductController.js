const ProductService = require("../services/ProductService");
const response = require("../utils/response");

class ProductController {
  async getAll(req, res, next) {
    try {
      const { categoryId, keyword } = req.query;

      const products = await ProductService.getProducts({
        categoryId,
        keyword,
      });

      return response.success(res, products, "Lấy sản phẩm thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
