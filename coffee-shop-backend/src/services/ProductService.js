const ProductRepository = require('../repositories/ProductRepository');
const ProductSizeRepository = require('../repositories/ProductSizeRepository');
const ProductImageRepository = require('../repositories/ProductImageRepository');
const CategoryRepository = require('../repositories/CategoryRepository');

class ProductService {
  /**
   * Get all products
   */
  async getAllProducts(options = {}) {
    const { status, ...rest } = options;
    const conditions = {};

    if (status) {
      conditions.status = status;
    }

    return ProductRepository.findAllWithDetails(conditions, rest);
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await ProductRepository.findByIdWithDetails(id);

    if (!product) {
      throw new Error('Product không tồn tại');
    }

    return product;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, options = {}) {
    // Check if category exists
    const category = await CategoryRepository.findById(categoryId);
    if (!category || category.is_deleted === 1) {
      throw new Error('Category không tồn tại');
    }

    return ProductRepository.findByCategory(categoryId, options);
  }

  /**
   * Create new product
   */
  async createProduct(data) {
    // Validate category exists
    const category = await CategoryRepository.findById(data.category_id);
    if (!category || category.is_deleted === 1) {
      throw new Error('Category không tồn tại');
    }

    // Check if product name already exists
    const existingProduct = await ProductRepository.findByName(data.name);
    if (existingProduct) {
      throw new Error('Tên product đã tồn tại');
    }

    // Create product
    const product = await ProductRepository.create({
      name: data.name.trim(),
      category_id: data.category_id,
      status: data.status || 'available',
      description: data.description || null,
    });

    // Create product sizes if provided
    if (data.sizes && Array.isArray(data.sizes)) {
      for (const size of data.sizes) {
        await ProductSizeRepository.create({
          product_id: product.id,
          size: size.size,
          price: size.price,
        });
      }
    }

    // Create product images if provided
    if (data.images && Array.isArray(data.images)) {
      for (const image of data.images) {
        await ProductImageRepository.create({
          product_id: product.id,
          image_url: image.url,
          isThumbnail: image.isThumbnail ? 1 : 0,
        });
      }
    }

    // Return complete product with details
    return this.getProductById(product.id);
  }

  /**
   * Update product
   */
  async updateProduct(id, data) {
    // Check if product exists
    const product = await this.getProductById(id);

    // If updating category, check if category exists
    if (data.category_id) {
      const category = await CategoryRepository.findById(data.category_id);
      if (!category || category.is_deleted === 1) {
        throw new Error('Category không tồn tại');
      }
    }

    // If updating name, check if new name already exists
    if (data.name && data.name !== product.name) {
      const existingProduct = await ProductRepository.findByName(data.name);
      if (existingProduct && existingProduct.id !== parseInt(id)) {
        throw new Error('Tên product đã tồn tại');
      }
    }

    // Prepare update data
    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.category_id) updateData.category_id = data.category_id;
    if (data.status) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;

    // Update product
    await ProductRepository.update(id, updateData);

    // Update sizes if provided
    if (data.sizes && Array.isArray(data.sizes)) {
      // Soft delete old sizes
      await ProductSizeRepository.deleteByProductId(id);

      // Create new sizes
      for (const size of data.sizes) {
        await ProductSizeRepository.create({
          product_id: id,
          size: size.size,
          price: size.price,
        });
      }
    }

    // Add new images if provided
    if (data.images && Array.isArray(data.images)) {
      for (const image of data.images) {
        await ProductImageRepository.create({
          product_id: id,
          image_url: image.url,
          isThumbnail: image.isThumbnail ? 1 : 0,
        });
      }
    }

    // Return updated product with details
    return this.getProductById(id);
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    // Check if product exists
    await this.getProductById(id);

    // Soft delete product
    const deleted = await ProductRepository.update(id, { status: 'unavailable' });

    if (!deleted) {
      throw new Error('Xóa product thất bại');
    }

    return true;
  }

  /**
   * Search products
   */
  async searchProducts(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllProducts(options);
    }

    return ProductRepository.search(keyword.trim(), options);
  }

  /**
   * Count total products
   */
  async countProducts(status) {
    const conditions = {};
    if (status) conditions.status = status;
    return ProductRepository.count(conditions);
  }

  /**
   * Count products by category
   */
  async countProductsByCategory(categoryId) {
    return ProductRepository.countByCategory(categoryId);
  }

  /**
   * Count search results
   */
  async countSearchResults(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.countProducts(options.status);
    }
    return ProductRepository.countSearch(keyword.trim(), options);
  }

  /**
   * Restore deleted product
   */
  async restoreProduct(id) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error('Product không tồn tại');
    }

    if (product.status === 'available') {
      throw new Error('Product chưa bị xóa');
    }

    // Restore by setting status = available
    const restored = await ProductRepository.update(id, { status: 'available' });

    return this.getProductById(id);
  }
}

module.exports = new ProductService();