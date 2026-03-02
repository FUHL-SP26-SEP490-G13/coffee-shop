const ProductRepository = require('../repositories/ProductRepository');
const ProductSizeRepository = require('../repositories/ProductSizeRepository');
const ProductImageRepository = require('../repositories/ProductImageRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const db = require('../config/database');

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
    // ===== 1. Check tồn tại =====
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Product không tồn tại');
    }

    // ===== 2. Update basic info =====
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.category_id !== undefined) {
      const category = await CategoryRepository.findById(data.category_id);
      if (!category) {
        throw new Error('Category không tồn tại');
      }
      updateData.category_id = data.category_id;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (Object.keys(updateData).length > 0) {
      await ProductRepository.update(id, updateData);
    }

    // ===== 3. Delete sizes =====
    if (data.deleteSizeIds && Array.isArray(data.deleteSizeIds)) {
      for (const sizeId of data.deleteSizeIds) {
        await ProductSizeRepository.softDelete(sizeId);
      }
    }

    // ===== 4. Sync sizes (DELETE dư + UPSERT) =====
    // ===== 4. Sync sizes =====
    if (data.sizes && Array.isArray(data.sizes)) {
      const incomingSizes = data.sizes.map((s) => s.size);

      // 4.1 Soft delete size không còn
      await ProductSizeRepository.softDeleteNotIn(id, incomingSizes);

      // 4.2 Upsert
      for (const size of data.sizes) {
        await ProductSizeRepository.upsert(id, size.size, size.price);
      }
    }

    // ===== 5. Delete images =====
    if (data.deleteImageIds && Array.isArray(data.deleteImageIds)) {
      for (const imageId of data.deleteImageIds) {
        const image = await ProductImageRepository.findById(imageId);
        if (!image) continue;

        await ProductImageRepository.softDelete(imageId);

        const publicId = extractPublicId(image.image_url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    // ===== 6. Add new images =====
    if (data.newImages && Array.isArray(data.newImages)) {
      for (const image of data.newImages) {
        await ProductImageRepository.create({
          product_id: id,
          image_url: image.url,
          isThumbnail: 0,
        });
      }
    }

    return await this.getProductById(id);
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    // Check if product exists
    await this.getProductById(id);

    // Soft delete product
    const deleted = await ProductRepository.update(id, {
      status: 'unavailable',
    });

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
    const restored = await ProductRepository.update(id, {
      status: 'available',
    });

    return this.getProductById(id);
  }
}

module.exports = new ProductService();
