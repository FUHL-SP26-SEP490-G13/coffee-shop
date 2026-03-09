const ProductRepository = require('../repositories/ProductRepository');
const ProductSizeRepository = require('../repositories/ProductSizeRepository');
const ProductImageRepository = require('../repositories/ProductImageRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/ErrorResponse');

class ProductService {
  /**
   * Extract Cloudinary public_id from URL
   */
  extractPublicId(url) {
    try {
      const matches = url.match(/\/products\/([^/.]+)/);
      return matches ? `products/${matches[1]}` : null;
    } catch (error) {
      return null;
    }
  }

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
      throw new ErrorResponse(404, 'Product không tồn tại');
    }
    return product;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, options = {}) {
    const category = await CategoryRepository.findById(categoryId);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, 'Category không tồn tại');
    }

    return ProductRepository.findByCategory(categoryId, options);
  }

  /**
   * Create new product
   * CHỈ TẠO: name, category_id, status, description, images
   */
  async createProduct(data) {
    // 1. Validate category exists
    const category = await CategoryRepository.findById(data.category_id);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, 'Category không tồn tại');
    }

    // 2. Check if product name already exists
    const existingProduct = await ProductRepository.findByName(data.name);
    if (existingProduct) {
      throw new ErrorResponse(409, 'Tên product đã tồn tại');
    }

    // 3. Validate images
    if (data.images && data.images.length > 5) {
      throw new ErrorResponse(400, 'Tối đa chỉ được upload 5 ảnh');
    }

    // 4. Create product (KHÔNG có sizes)
    const product = await ProductRepository.create({
      name: data.name.trim(),
      category_id: data.category_id,
      status: data.status || 'available',
      description: data.description || null,
    });

    // 5. Create product images
    // ẢNH ĐẦU TIÊN LÀ THUMBNAIL
    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        await ProductImageRepository.create({
          product_id: product.id,
          image_url: data.images[i].url,
          isThumbnail: i === 0 ? 1 : 0, // Ảnh đầu tiên là thumbnail
        });
      }
    }

    return this.getProductById(product.id);
  }

  /**
   * Update product
   * CÓ THỂ: name, category_id, status, description, sizes, images
   */
  async updateProduct(id, data) {
    // 1. Check if product exists
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new ErrorResponse(404, 'Product không tồn tại');
    }

    // 2. Prepare update data for product table
    const updateData = {};

    if (data.name !== undefined) {
      // Check duplicate name
      const duplicateProduct = await ProductRepository.findByName(
        data.name.trim(),
      );
      if (duplicateProduct && duplicateProduct.id !== parseInt(id)) {
        throw new ErrorResponse(409, 'Tên product đã tồn tại');
      }
      updateData.name = data.name.trim();
    }

    if (data.category_id !== undefined) {
      const category = await CategoryRepository.findById(data.category_id);
      if (!category || category.is_deleted === 1) {
        throw new ErrorResponse(404, 'Category không tồn tại');
      }
      updateData.category_id = data.category_id;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    // Update product basic info
    if (Object.keys(updateData).length > 0) {
      await ProductRepository.update(id, updateData);
    }

    // 3. Handle SIZE updates (CHỈ TRONG UPDATE)
    if (data.sizes && Array.isArray(data.sizes)) {
      const validSizes = ['S', 'M', 'L'];

      // Validate sizes
      for (const sizeItem of data.sizes) {
        if (!validSizes.includes(sizeItem.size.toUpperCase())) {
          throw new ErrorResponse(400, `Size "${sizeItem.size}" không hợp lệ`);
        }

        // có thể thêm điều kiện price ở đây nữa nếu muốn
        if (!sizeItem.price || sizeItem.price <= 0) {
          throw new ErrorResponse(
            400,
            `Giá cho size ${sizeItem.size} phải là số dương`,
          );
        }
      }

      // Check duplicate sizes
      const sizes = data.sizes.map((s) => s.size);
      const uniqueSizes = [...new Set(sizes)];
      if (sizes.length !== uniqueSizes.length) {
       throw new ErrorResponse(400, 'Không được có size trùng lặp');
      }

      // Max 3 sizes
      if (data.sizes.length > 3) {
         throw new ErrorResponse(400, 'Tối đa chỉ có 3 loại size (S, M, L)');
      }

      // Get list of sizes to keep
      const incomingSizes = data.sizes.map((s) => s.size);

      // Soft delete sizes not in the incoming list
      await ProductSizeRepository.softDeleteNotIn(id, incomingSizes);

      // Upsert sizes (insert new or update existing)
      for (const sizeItem of data.sizes) {
        await ProductSizeRepository.upsert(id, sizeItem.size, sizeItem.price);
      }
    }

    // 4. Handle DELETE specific sizes (deleteSizeIds)
    if (data.deleteSizeIds && Array.isArray(data.deleteSizeIds)) {
      for (const sizeId of data.deleteSizeIds) {
        await ProductSizeRepository.softDelete(sizeId);
      }
    }

    //  HANDLE IMAGE UPDATES
    let thumbnailDeleted = false;

    // Delete specific images
    if (data.deleteImageIds && Array.isArray(data.deleteImageIds)) {
      for (const imageId of data.deleteImageIds) {
        const image = await ProductImageRepository.findById(imageId);
        if (!image) {
          continue;
        }

        // Kiểm tra xem ảnh bị xóa có phải thumbnail không
        if (image.isThumbnail === 1) {
          thumbnailDeleted = true;
        }

        // Soft delete image record
        await ProductImageRepository.softDelete(imageId);

        // Delete from Cloudinary
        const publicId = this.extractPublicId(image.image_url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Failed to delete from Cloudinary:', err);
          }
        }
      }
    }

    //Get remaining images AFTER deletion
    const remainingImages = await ProductImageRepository.findByProductId(id);

    // Add new images
    if (data.newImages && Array.isArray(data.newImages)) {
      // Nếu KHÔNG CÒN ảnh nào → ảnh mới đầu tiên là thumbnail
      const shouldSetFirstAsThumbnail = remainingImages.length === 0;

      for (let i = 0; i < data.newImages.length; i++) {
        await ProductImageRepository.create({
          product_id: id,
          image_url: data.newImages[i].url,
          isThumbnail: shouldSetFirstAsThumbnail && i === 0 ? 1 : 0,
        });
      }
    }

    // Nếu thumbnail bị xóa VÀ còn ảnh cũ
    if (thumbnailDeleted && remainingImages.length > 0) {
      // Set ảnh còn lại đầu tiên (id nhỏ nhất) làm thumbnail
      const firstRemainingImage = remainingImages.sort(
        (a, b) => a.id - b.id,
      )[0];
      await ProductImageRepository.setThumbnail(id, firstRemainingImage.id);
    }

    return this.getProductById(id);
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id) {
    await this.getProductById(id);

    // const deleted = await ProductRepository.update(id, {
    //   status: 'unavailable',
    // });

    const deleted = await ProductRepository.softDelete(id);

    if (!deleted) {
      throw new ErrorResponse(500, 'Xóa product thất bại');
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
       throw new ErrorResponse(404, 'Product không tồn tại');
    }

    if (product.status === 'available') {
      throw new ErrorResponse(400, 'Product chưa bị xóa');
    }

    await ProductRepository.update(id, { status: 'available' });

    return this.getProductById(id);
  }
}

module.exports = new ProductService();
