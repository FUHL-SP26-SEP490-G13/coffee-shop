const ProductSizeService = require('../services/ProductSizeService');
const response = require('../utils/response');
const ErrorResponse = require('../utils/ErrorResponse');

class ProductSizeController {
  // Lấy tất cả size của 1 sản phẩm
  async getByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const sizes = await ProductSizeService.getByProductId(productId);
      return response.success(res, sizes, 'Lấy danh sách size thành công');
    } catch (error) {
      next(error);
    }
  }

  // Lấy 1 size theo id
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const size = await ProductSizeService.getById(id);
      return response.success(res, size, 'Lấy size thành công');
    } catch (error) {
      next(error);
    }
  }

  // Thêm mới size cho sản phẩm
  async create(req, res, next) {
    try {
      const data = req.body;
      const size = await ProductSizeService.create(data);
      return response.success(res, size, 'Tạo size thành công');
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật size
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const size = await ProductSizeService.update(id, data);
      return response.success(res, size, 'Cập nhật size thành công');
    } catch (error) {
      next(error);
    }
  }

  // Xóa size
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ProductSizeService.delete(id);
      return response.success(res, null, 'Xóa size thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductSizeController();
