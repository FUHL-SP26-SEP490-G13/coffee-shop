const CategoryService = require('../services/CategoryService');
const response = require('../utils/response');

class CategoryController {
  /**
   * Get all categories
   * GET /api/categories
   */
  async getAll(req, res, next) {
    try {
      const { with_count } = req.query;

      let categories;

      if (with_count === 'true') {
        categories = await CategoryService.getCategoriesWithProductCount();
      } else {
        categories = await CategoryService.getAllCategories();
      }

      return response.success(
        res,
        categories,
        'Lấy danh sách categories thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
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
        'Lấy thông tin category thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  async create(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);

      return response.success(
        res,
        category,
        'Tạo category thành công',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);

      return response.success(
        res,
        category,
        'Cập nhật category thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);

      return response.success(
        res,
        null,
        'Xóa category thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search categories
   * GET /api/categories/search
   */
  async search(req, res, next) {
    try {
      const { keyword, limit, page } = req.query;
      const offset = (page - 1) * limit || 0;

      const categories = await CategoryService.searchCategories(keyword, {
        limit: parseInt(limit) || 20,
        offset,
      });

      return response.success(
        res,
        categories,
        'Tìm kiếm categories thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore deleted category
   * POST /api/categories/:id/restore
   */
  async restore(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.restoreCategory(id);

      return response.success(
        res,
        category,
        'Khôi phục category thành công'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
