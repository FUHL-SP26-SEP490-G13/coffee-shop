const CategoryService = require('../services/CategoryService');
const response = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const extractPublicId = require('../helpers/extractPublicId');


class CategoryController {
  /**
   * GET /api/categories
   */
  async getAll(req, res, next) {
    try {
      const { with_count } = req.query;
      const categories = await CategoryService.getAllCategories({ 
        with_count: with_count === 'true' 
      });
      return response.success(res, categories, 'Lấy danh sách categories thành công');
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
        code: req.body.code,
        image_url: imageUrl,
        type: req.body.type !== undefined ? req.body.type : null,
      };

      const category = await CategoryService.createCategory(categoryData);

      return response.success(res, category, 'Tạo category thành công', 201);
    } catch (error) {
      // Nếu DB fail thì xoá ảnh vừa upload
      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(uploadedPublicId);
        } catch (cloudinaryError) {
          console.error('Failed to cleanup Cloudinary image:', cloudinaryError);
        }
      }

      next(error);
    }
  }

  /**
   * PUT /api/categories/:id
   */
  async update(req, res, next) {
    let newUploadedPublicId = null;

    try {
      const { id } = req.params;
      const { remove_image } = req.body;

      const oldCategory = await CategoryService.getCategoryById(id);

      const categoryData = {};

      if (req.body.name) {
        categoryData.name = req.body.name;
      }

      if (req.body.code) {
        categoryData.code = req.body.code;
      }

      if (req.body.type !== undefined) {
        categoryData.type = req.body.type;
      }

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'categories',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
          ],
        });

        categoryData.image_url = result.secure_url;
        newUploadedPublicId = result.public_id;
      }

      // xóa ảnh nếu có
      if (req.body.remove_image?.toString() === 'true') {
        categoryData.image_url = null;
      }

      // Không có gì để update
      if (Object.keys(categoryData).length === 0) {
        return response.error(res, 'Không có dữ liệu để cập nhật', 400);
      }

      // Update DB trước
      const updatedCategory = await CategoryService.updateCategory(id, categoryData);

      /**
       * Sau khi update thành công:
       * - Nếu upload ảnh mới → xoá ảnh cũ
       * - Nếu remove_image → xoá ảnh cũ
       */
      if ((req.file || remove_image === 'true') && oldCategory.image_url) {
        const publicId = extractPublicId(oldCategory.image_url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (cloudinaryError) {
            console.error('Failed to delete old Cloudinary image:', cloudinaryError);
          }
        }
      }

      return response.success(res, updatedCategory, 'Cập nhật category thành công');
    } catch (error) {
      // Nếu upload ảnh mới mà DB fail → rollback ảnh mới
      if (newUploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(newUploadedPublicId);
        } catch (cloudinaryError) {
          console.error('Failed to cleanup Cloudinary image:', cloudinaryError);
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
}

module.exports = new CategoryController();
