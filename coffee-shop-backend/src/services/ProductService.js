const ProductRepository = require("../repositories/ProductRepository");

class ProductService {
  async getProducts(filters) {
    return ProductRepository.getProducts(filters);
  }
}

module.exports = new ProductService();
