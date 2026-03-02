const CategoryService = require('../services/CategoryService');
const response = require('../utils/response');
const cloudinary = require('../config/cloudinary');

/**
 * Helper: Extract Cloudinary public_id từ URL
 */
function extractPublicId(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');

    const fileName = segments.pop(); // abc123.jpg
    const folder = segments.pop(); // categories

    return `${folder}/${fileName.split('.')[0]}`;
  } catch (error) {
    return null;
  }
}

class CategoryController {
  /**
   * GET /api/categories
   */
  async getAll(req, res, next) {
    try {
      const { with_count, page, limit } = req.query;

      if (page && limit) {
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        const categories = await CategoryService.getAllCategories({
          limit: limitNumber,
          offset,
        });

        const total = await CategoryService.countCategories();

        return response.paginate(
          res,
          categories,
          pageNumber,
          limitNumber,
          total,
          'Lấy danh sách categories thành công',
        );
      }

      let categories;

      if (with_count === 'true') {
        categories = await CategoryService.getCategoriesWithProductCount();
      } else {
        categories = await CategoryService.getAllCategories();
      }

      return response.success(
        res,
        categories,
        'Lấy danh sách categories thành công',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { with_count } = req.query;

      let category;

      if (with_count === 'true') {
        category = await CategoryService.getCategoryWithProductCount(id);
      } else {
        category = await CategoryService.getCategoryById(id);
      }

      return response.success(
        res,
        category,
        'Lấy thông tin category thành công',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories
   */
  async create(req, res, next) {
    let uploadedPublicId = null;

    try {
      let imageUrl = null;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'categories',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
          ],
        });

        imageUrl = result.secure_url;
        uploadedPublicId = result.public_id;
      }

      const categoryData = {
        name: req.body.name,
        image_url: imageUrl,
      };

      const category = await CategoryService.createCategory(categoryData);

      return response.success(res, category, 'Tạo category thành công', 201);
    } catch (error) {
      // Nếu DB fail thì xoá ảnh vừa upload
      if (uploadedPublicId) {
        await cloudinary.uploader.destroy(uploadedPublicId);
      }

      next(error);
    }
  }

  /**
   * PUT /api/categories/:id
   */
  async update(req, res, next) {
    let newUploadedImageUrl = null;

    try {
      const { id } = req.params;
      const { remove_image } = req.body;

      const oldCategory = await CategoryService.getCategoryById(id);

      const categoryData = {};

      // 1️⃣ Update name nếu có
      if (req.body.name) {
        categoryData.name = req.body.name;
      }

      /**
       * 2️⃣ Upload ảnh mới
       */
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'categories',
        });

        categoryData.image_url = result.secure_url;
        newUploadedImageUrl = result.secure_url;
      }

    
      if (req.body.remove_image?.toString() === 'true') {
        categoryData.image_url = null;
      }

      // Không có gì để update
      if (Object.keys(categoryData).length === 0) {
        return response.error(res, 'Không có dữ liệu để cập nhật', 400);
      }

      // 🔥 Update DB trước
      const updatedCategory = await CategoryService.updateCategory(
        id,
        categoryData,
      );

      /**
       * Sau khi update thành công:
       * - Nếu upload ảnh mới → xoá ảnh cũ
       * - Nếu remove_image → xoá ảnh cũ
       */
      if ((req.file || remove_image) && oldCategory.image_url) {
        const publicId = extractPublicId(oldCategory.image_url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      return response.success(
        res,
        updatedCategory,
        'Cập nhật category thành công',
      );
    } catch (error) {
      // Nếu upload ảnh mới mà DB fail → rollback ảnh mới
      if (newUploadedImageUrl) {
        const publicId = extractPublicId(newUploadedImageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await CategoryService.deleteCategory(id);

      return response.success(res, null, 'Xóa category thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/search
   */
  async search(req, res, next) {
    try {
      const { keyword, limit, page } = req.query;

      if (page && limit) {
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        const categories = await CategoryService.searchCategories(keyword, {
          limit: limitNumber,
          offset,
        });

        const total = await CategoryService.countSearchResults(keyword);

        return response.paginate(
          res,
          categories,
          pageNumber,
          limitNumber,
          total,
          'Tìm kiếm categories thành công',
        );
      }

      const categories = await CategoryService.searchCategories(keyword, {
        limit: parseInt(limit) || 20,
      });

      return response.success(
        res,
        categories,
        'Tìm kiếm categories thành công',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories/:id/restore
   */
  async restore(req, res, next) {
    try {
      const { id } = req.params;

      const category = await CategoryService.restoreCategory(id);

      return response.success(res, category, 'Khôi phục category thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
