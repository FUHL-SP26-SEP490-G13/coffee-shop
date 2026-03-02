const ProductService = require('../services/ProductService');
const response = require('../utils/response');
const { extractPublicId } = require('../utils/cloudinaryHelper');
const cloudinary = require('../config/cloudinary');

class ProductController {
  /**
   * Get all products
   * GET /api/products
   */
  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;

      // If pagination requested
      if (page && limit) {
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

      // Without pagination
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
    try {
      const imageUrls = [];

      // Upload images to Cloudinary if provided
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' },
            ],
          });
          imageUrls.push({
            url: result.secure_url,
            isThumbnail: imageUrls.length === 0, // First image is thumbnail
          });
        }
      }

      const productData = {
        ...req.body,
        images: imageUrls,
      };

      const product = await ProductService.createProduct(productData);

      return response.success(res, product, 'Tạo product thành công', 201);
    } catch (error) {
      // Delete uploaded images if product creation fails
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          if (file.cloudinary_id) {
            await cloudinary.uploader.destroy(file.cloudinary_id);
          }
        }
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      console.log('TYPE sizes:', typeof req.body.sizes);
      console.log('VALUE sizes:', req.body.sizes);

      // ===== PARSE JSON =====
      ['sizes', 'deleteSizeIds', 'deleteImageIds'].forEach((field) => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });

      const imageUrls = [];

      // ===== UPLOAD NEW IMAGES =====
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' },
            ],
          });

          imageUrls.push({
            url: result.secure_url,
            isThumbnail: false,
          });
        }
      }

      const productData = {
        ...req.body,
      };

      if (imageUrls.length > 0) {
        productData.newImages = imageUrls;
      }

      const product = await ProductService.updateProduct(id, productData);

      return response.success(res, product, 'Cập nhật product thành công');
    } catch (error) {
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
