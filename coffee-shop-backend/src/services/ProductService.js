const ProductRepository = require('../repositories/ProductRepository');
const ProductSizeRepository = require('../repositories/ProductSizeRepository');
const ProductImageRepository = require('../repositories/ProductImageRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/ErrorResponse');
const slugify = require('slugify');

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
      throw new ErrorResponse(404, 'Product không tồn tại');
    }
    return product;
  }

  async getProductsByCategory(categoryId, options = {}) {
    const category = await CategoryRepository.findById(categoryId);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, 'Category không tồn tại');
    }

    return ProductRepository.findByCategory(categoryId, options);
  }

  /**
   * Create new product
   * CHỈ TẠO: name, code ,category_id, status, description, images
   */
  async createProduct(data) {
    // Validate category exists
    const category = await CategoryRepository.findById(data.category_id);
    if (!category || category.is_deleted === 1) {
      throw new ErrorResponse(404, 'Category không tồn tại');
    }

    // Check if product name already exists
    const existingNameProduct = await ProductRepository.findByName(data.name);
    if (existingNameProduct) {
      throw new ErrorResponse(409, 'Tên sản phẩm đã tồn tại');
    }

    // Check if product code already exists
    const existingCodeProduct = await ProductRepository.findByCode(data.code);
    if (existingCodeProduct) {
      throw new ErrorResponse(409, 'Mã code sản phẩm đã tồn tại');
    }

    // Validate images
    if (data.images && data.images.length > 3) {
      throw new ErrorResponse(400, 'Tối đa chỉ được upload 3 ảnh');
    }

    let baseSlug = slugify(data.name.replace(/đ/g, 'd').replace(/Đ/g, 'D'), { lower: true, strict: true, locale: 'vi' });
    let slug = baseSlug;
    let counter = 1;
    while (await ProductRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create product (KHÔNG có sizes)
    const product = await ProductRepository.create({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      category_id: data.category_id,
      status: data.status || 'available',
      description: data.description || null,
      slug: slug,
    });

    // Create product images
    // ẢNH ĐẦU TIÊN LÀ THUMBNAIL
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

  /**
   * Update product
   * CÓ THỂ: name, code ,category_id, status, description, sizes, images
   */
  async updateProduct(id, data) {
    // Check if product exists
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new ErrorResponse(404, 'Product không tồn tại');
    }

    // Prepare update data for product table
    const updateData = {};

    if (data.name !== undefined) {
      const duplicateProduct = await ProductRepository.findByName(
        data.name.trim(),
      );
      if (duplicateProduct && duplicateProduct.id !== parseInt(id)) {
        throw new ErrorResponse(409, 'Tên sản phẩm đã tồn tại');
      }
      updateData.name = data.name.trim();

      let baseSlug = slugify(data.name.replace(/đ/g, 'd').replace(/Đ/g, 'D'), { lower: true, strict: true, locale: 'vi' });
      let slug = baseSlug;
      let counter = 1;
      let isUnique = false;
      while (!isUnique) {
        const checkSlug = await ProductRepository.findBySlug(slug);
        if (!checkSlug || checkSlug.id === parseInt(id)) {
          isUnique = true;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      updateData.slug = slug;
    }

    if (data.code !== undefined) {
      // Check duplicate code
      const duplicateCodeProduct = await ProductRepository.findByCode(
        data.code.trim(),
      );
      if (duplicateCodeProduct && duplicateCodeProduct.id !== parseInt(id)) {
        throw new ErrorResponse(409, 'Mã code sản phẩm đã tồn tại');
      }
      updateData.code = data.code.trim().toUpperCase();
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

    if (Object.keys(updateData).length > 0) {
      await ProductRepository.update(id, updateData);
    }

    if (data.sizes && Array.isArray(data.sizes)) {
      const validSizes = ['S', 'M', 'L'];

      for (const sizeItem of data.sizes) {
        if (!validSizes.includes(sizeItem.size.toUpperCase())) {
          throw new ErrorResponse(400, `Size "${sizeItem.size}" không hợp lệ`);
        }

        // price
        if (!sizeItem.price || sizeItem.price <= 0) {
          throw new ErrorResponse(
            400,
            `Giá cho size ${sizeItem.size} phải là số dương`,
          );
        }
      }

      const sizes = data.sizes.map((s) => s.size);
      const uniqueSizes = [...new Set(sizes)];
      if (sizes.length !== uniqueSizes.length) {
        throw new ErrorResponse(400, 'Không được có size trùng lặp');
      }

      if (data.sizes.length > 3) {
        throw new ErrorResponse(400, 'Tối đa chỉ có 3 loại size (S, M, L)');
      }

      // check price
      const getPrice = (sizeName) => {
        const found = data.sizes.find((s) => s.size.toUpperCase() === sizeName);
        return found ? Number(found.price) : null;
      };

      const priceS = getPrice('S');
      const priceM = getPrice('M');
      const priceL = getPrice('L');

      if (priceS !== null && priceM !== null && priceS >= priceM) {
        throw new ErrorResponse(400, 'Giá size S phải nhỏ hơn size M');
      }
      if (priceM !== null && priceL !== null && priceM >= priceL) {
        throw new ErrorResponse(400, 'Giá size M phải nhỏ hơn size L');
      }
      if (priceS !== null && priceL !== null && priceS >= priceL) {
        throw new ErrorResponse(400, 'Giá size S phải nhỏ hơn size L');
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
            console.error('Failed to delete from Cloudinary:', err);
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

    // set thumbnail lại nếu bị xóa
    if (thumbnailDeleted && remainingImages.length > 0) {
      const firstRemainingImage = remainingImages.sort(
        (a, b) => a.id - b.id,
      )[0];
      await ProductImageRepository.setThumbnail(id, firstRemainingImage.id);
    }

    return this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.getProductById(id);

    const deleted = await ProductRepository.softDelete(id);

    if (!deleted) {
      throw new ErrorResponse(500, 'Xóa product thất bại');
    }

    return true;
  }

  async searchProducts(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllProducts(options);
    }

    return ProductRepository.search(keyword.trim(), options);
  }

  async countProducts(filters = {}) {
    const conditions = {};

    if (filters.status) conditions.status = filters.status;
    if (filters.category_id) conditions.category_id = filters.category_id;

    return ProductRepository.countAll(conditions, filters);
  }

  async countProductsByCategory(categoryId, options = {}) {
    return ProductRepository.countByCategory(
      categoryId,
      options
    );
  }

  async countSearchResults(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.countProducts({
        status: options.status,
        category_id: options.category_id,
        min_price: options.min_price,
        max_price: options.max_price,
        size: options.size,
      });
    }

    return ProductRepository.countSearch(keyword.trim(), options);
  }

  async getBestSellerProducts(limit = 8) {
    return ProductRepository.findBestSellers(limit);
  }
}

module.exports = new ProductService();
