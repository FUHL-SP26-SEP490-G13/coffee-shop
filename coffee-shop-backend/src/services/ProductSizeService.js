const ProductSizeRepository = require('../repositories/ProductSizeRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class ProductSizeService {
  async getByProductId(productId) {
    return ProductSizeRepository.findByProductId(productId);
  }

  async getById(id) {
    const size = await ProductSizeRepository.findById(id);
    if (!size) throw new ErrorResponse(404, 'Size không tồn tại');
    return size;
  }

  async create(data) {
    // data: { product_id, size, price }
    if (!data.product_id || !data.size || !data.price) {
      throw new ErrorResponse(400, 'Thiếu thông tin size');
    }
    // Có thể kiểm tra trùng size cho 1 product ở đây
    return ProductSizeRepository.upsert(data.product_id, data.size, data.price);
  }

  async update(id, data) {
    // data: { size, price }
    const sizeObj = await ProductSizeRepository.findById(id);
    if (!sizeObj) throw new ErrorResponse(404, 'Size không tồn tại');
    // Cập nhật size và price
    return ProductSizeRepository.update(id, {
      size: data.size || sizeObj.size,
      price: data.price || sizeObj.price,
    });
  }

  async delete(id) {
    const sizeObj = await ProductSizeRepository.findById(id);
    if (!sizeObj) throw new ErrorResponse(404, 'Size không tồn tại');
    // Soft delete
    return ProductSizeRepository.update(id, { is_deleted: 1 });
  }
}

module.exports = new ProductSizeService();
