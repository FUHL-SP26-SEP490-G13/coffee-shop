const ProductRepository = require("../repositories/ProductRepository");
const ProductSizeRepository = require("../repositories/ProductSizeRepository");
const ProductImageRepository = require("../repositories/ProductImageRepository");
const CategoryRepository = require("../repositories/CategoryRepository");
const cloudinary = require("../config/cloudinary");
const ErrorResponse = require("../utils/ErrorResponse");

class ProductService {
  extractPublicId(url) {
    try {
      const matches = url.match(/\/products\/([^/.]+)/);
      return matches ? `products/${matches[1]}` : null;
    } catch (error) {
      return null;
    }
  }

  async getAllProducts(options = {}) {
    const { status, category_id, sort, ...rest } = options;
    const conditions = {};

    if (status) {
      conditions.status = status;
    }

    if (category_id) {
      conditions.category_id = category_id;
    }

    return ProductRepository.findAllWithDetails(conditions, {
      ...rest,
      sort,
    });
  }

  async getProductById(id) {
    const product = await ProductRepository.findByIdWithDetails(id);
    if (!product) {
      throw new ErrorResponse(404, "Product không tồn tại");
    }
    return product;
  }

  async getProductsByCategory(categoryId, options = {}) {
    const category = await CategoryRepository.findById(categoryId);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, "Category không tồn tại");
    }

    return ProductRepository.findByCategory(categoryId, options);
  }

  async createProduct(data) {
    const category = await CategoryRepository.findById(data.category_id);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, "Category không tồn tại");
    }

    const existingProduct = await ProductRepository.findByName(data.name);
    if (existingProduct) {
      throw new ErrorResponse(409, "Tên product đã tồn tại");
    }

    if (data.images && data.images.length > 5) {
      throw new ErrorResponse(400, "Tối đa chỉ được upload 5 ảnh");
    }

    const product = await ProductRepository.create({
      name: data.name.trim(),
      category_id: data.category_id,
      status: data.status || "available",
      description: data.description || null,
    });

    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        await ProductImageRepository.create({
          product_id: product.id,
          image_url: data.images[i].url,
          isThumbnail: i === 0 ? 1 : 0,
        });
      }
    }

    return this.getProductById(product.id);
  }

  async updateProduct(id, data) {
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new ErrorResponse(404, "Product không tồn tại");
    }

    const updateData = {};

    if (data.name !== undefined) {
      const duplicateProduct = await ProductRepository.findByName(
        data.name.trim()
      );
      if (duplicateProduct && duplicateProduct.id !== parseInt(id)) {
        throw new ErrorResponse(409, "Tên product đã tồn tại");
      }
      updateData.name = data.name.trim();
    }

    if (data.category_id !== undefined) {
      const category = await CategoryRepository.findById(data.category_id);
      if (!category || category.is_deleted === 1) {
        throw new ErrorResponse(404, "Category không tồn tại");
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

    if (data.sizes && Array.isArray(data.sizes)) {
      const validSizes = ["S", "M", "L"];

      for (const sizeItem of data.sizes) {
        if (!validSizes.includes(sizeItem.size.toUpperCase())) {
          throw new ErrorResponse(400, `Size "${sizeItem.size}" không hợp lệ`);
        }

        if (!sizeItem.price || sizeItem.price <= 0) {
          throw new ErrorResponse(
            400,
            `Giá cho size ${sizeItem.size} phải là số dương`
          );
        }
      }

      const sizes = data.sizes.map((s) => s.size);
      const uniqueSizes = [...new Set(sizes)];
      if (sizes.length !== uniqueSizes.length) {
        throw new ErrorResponse(400, "Không được có size trùng lặp");
      }

      if (data.sizes.length > 3) {
        throw new ErrorResponse(400, "Tối đa chỉ có 3 loại size (S, M, L)");
      }

      const incomingSizes = data.sizes.map((s) => s.size);

      await ProductSizeRepository.softDeleteNotIn(id, incomingSizes);

      for (const sizeItem of data.sizes) {
        await ProductSizeRepository.upsert(id, sizeItem.size, sizeItem.price);
      }
    }

    if (data.deleteSizeIds && Array.isArray(data.deleteSizeIds)) {
      for (const sizeId of data.deleteSizeIds) {
        await ProductSizeRepository.softDelete(sizeId);
      }
    }

    let thumbnailDeleted = false;

    if (data.deleteImageIds && Array.isArray(data.deleteImageIds)) {
      for (const imageId of data.deleteImageIds) {
        const image = await ProductImageRepository.findById(imageId);
        if (!image) continue;

        if (image.isThumbnail === 1) {
          thumbnailDeleted = true;
        }

        await ProductImageRepository.softDelete(imageId);

        const publicId = this.extractPublicId(image.image_url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Failed to delete from Cloudinary:", err);
          }
        }
      }
    }

    const remainingImages = await ProductImageRepository.findByProductId(id);

    if (data.newImages && Array.isArray(data.newImages)) {
      const shouldSetFirstAsThumbnail = remainingImages.length === 0;

      for (let i = 0; i < data.newImages.length; i++) {
        await ProductImageRepository.create({
          product_id: id,
          image_url: data.newImages[i].url,
          isThumbnail: shouldSetFirstAsThumbnail && i === 0 ? 1 : 0,
        });
      }
    }

    if (thumbnailDeleted && remainingImages.length > 0) {
      const firstRemainingImage = remainingImages.sort(
        (a, b) => a.id - b.id
      )[0];
      await ProductImageRepository.setThumbnail(id, firstRemainingImage.id);
    }

    return this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.getProductById(id);

    const deleted = await ProductRepository.softDelete(id);

    if (!deleted) {
      throw new ErrorResponse(500, "Xóa product thất bại");
    }

    return true;
  }

  async searchProducts(keyword, options = {}) {
    if (!keyword || keyword.trim() === "") {
      return this.getAllProducts(options);
    }

    return ProductRepository.search(keyword.trim(), options);
  }

  async countProducts(filters = {}) {
    const conditions = {};

    if (filters.status) conditions.status = filters.status;
    if (filters.category_id) conditions.category_id = filters.category_id;

    return ProductRepository.countAll(conditions);
  }

  async countProductsByCategory(categoryId, options = {}) {
    return ProductRepository.countByCategory(
      categoryId,
      options.status || "available"
    );
  }

  async countSearchResults(keyword, options = {}) {
    if (!keyword || keyword.trim() === "") {
      return this.countProducts({
        status: options.status,
        category_id: options.category_id,
      });
    }

    return ProductRepository.countSearch(keyword.trim(), options);
  }

  async restoreProduct(id) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new ErrorResponse(404, "Product không tồn tại");
    }

    if (product.status === "available") {
      throw new ErrorResponse(400, "Product chưa bị xóa");
    }

    if (Number(product.is_deleted) === 0) {
      throw new ErrorResponse(400, "Product chưa bị xóa");
    }

    await ProductRepository.update(id, { is_deleted: 0 });

    return this.getProductById(id);
  }
}

module.exports = new ProductService();
