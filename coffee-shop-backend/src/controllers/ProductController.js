const ProductService = require('../services/ProductService');
const response = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/ErrorResponse');

class ProductController {
  /**
   * Get all sizes by product ID
   * GET /api/products/:id/sizes
   */
  async getSizesByProductId(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        throw new ErrorResponse(400, 'ID không hợp lệ');
      }
      const sizes = await ProductService.getSizesByProductId(id);
      return response.success(res, sizes, 'Lấy danh sách size thành công');
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all products
   * GET /api/products
   */
  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;

      if (page && limit) {
        if (page <= 0 || limit <= 0) {
          throw new ErrorResponse(400, 'page và limit phải lớn hơn 0');
        }

        const offset = (page - 1) * limit;
        const products = await ProductService.getAllProducts({
          limit: parseInt(limit),
          offset: parseInt(offset),
          status,
        });

        const total = await ProductService.countProducts(status);

        return response.paginate(
          res,
          products,
          page,
          limit,
          total,
          'Lấy danh sách products thành công',
        );
      }

      const products = await ProductService.getAllProducts({ status });

      return response.success(
        res,
        products,
        'Lấy danh sách products thành công',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ErrorResponse(400, 'ID không hợp lệ');
      }
      const product = await ProductService.getProductById(id);

      return response.success(res, product, 'Lấy thông tin product thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by category
   * GET /api/products/category/:categoryId
   */
  async getByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { page, limit } = req.query;

      if (page && limit) {
        const offset = (page - 1) * limit;
        const products = await ProductService.getProductsByCategory(
          categoryId,
          {
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
        );

        const total = await ProductService.countProductsByCategory(categoryId);

        return response.paginate(
          res,
          products,
          page,
          limit,
          total,
          'Lấy danh sách products theo category thành công',
        );
      }

      const products = await ProductService.getProductsByCategory(categoryId);

      return response.success(
        res,
        products,
        'Lấy danh sách products theo category thành công',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new product
   * POST /api/products
   */
  async create(req, res, next) {
    let uploadedImages = [];

    try {
      // Upload images to Cloudinary
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' },
            ],
          });

          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
            isThumbnail: uploadedImages.length === 0, // First image is thumbnail
          });
        }
      }

      const productData = {
        ...req.body,
        images: uploadedImages,
      };

      const product = await ProductService.createProduct(productData);

      return response.success(res, product, 'Tạo product thành công', 201);
    } catch (error) {
      // Rollback: Delete uploaded images if product creation fails
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error('Failed to delete image:', err);
          }
        }
      }
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  async update(req, res, next) {
    let uploadedImages = [];

    try {
      const { id } = req.params;

      // Get current product to check image limit
      const currentProduct = await ProductService.getProductById(id);
      const currentImageCount = currentProduct.images
        ? currentProduct.images.length
        : 0;
      const deleteImageCount = req.body.deleteImageIds
        ? req.body.deleteImageIds.length
        : 0;
      const newImageCount = req.files ? req.files.length : 0;

      // Calculate total images after update
      const totalImagesAfterUpdate =
        currentImageCount - deleteImageCount + newImageCount;

      if (totalImagesAfterUpdate > 5) {
        return next(
          new ErrorResponse(
            400,
            `Tổng số ảnh không được vượt quá 5. Hiện tại: ${currentImageCount}, Xóa: ${deleteImageCount}, Thêm mới: ${newImageCount}`,
          ),
        );
      }

      // Upload new images to Cloudinary
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' },
            ],
          });

          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
            isThumbnail: false, // New images are not thumbnail by default
          });
        }
      }

      const productData = {
        ...req.body,
        newImages: uploadedImages.length > 0 ? uploadedImages : undefined,
      };

      const product = await ProductService.updateProduct(id, productData);

      return response.success(res, product, 'Cập nhật product thành công');
    } catch (error) {
      // Rollback: Delete uploaded images if update fails
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error('Failed to delete image:', err);
          }
        }
      }
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ErrorResponse(400, 'ID không hợp lệ');
      }

      await ProductService.deleteProduct(id);

      return response.success(res, null, 'Xóa product thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products
   * GET /api/products/search
   */
  async search(req, res, next) {
    try {
      const { keyword, limit, page, category_id, status } = req.query;

      if (page && limit) {
        const offset = (page - 1) * limit;
        const products = await ProductService.searchProducts(keyword, {
          limit: parseInt(limit),
          offset: parseInt(offset),
          category_id,
          status,
        });

        const total = await ProductService.countSearchResults(keyword, {
          category_id,
          status,
        });

        return response.paginate(
          res,
          products,
          page,
          limit,
          total,
          'Tìm kiếm products thành công',
        );
      }

      const products = await ProductService.searchProducts(keyword, {
        limit: parseInt(limit) || 20,
        category_id,
        status,
      });

      return response.success(res, products, 'Tìm kiếm products thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore deleted product
   * POST /api/products/:id/restore
   */
  async restore(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.restoreProduct(id);

      return response.success(res, product, 'Khôi phục product thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
