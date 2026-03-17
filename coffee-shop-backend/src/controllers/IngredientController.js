const RecipeService = require('../services/RecipeService');
const response = require('../utils/response');

class IngredientController {
  /**
   * Get all ingredients
   * GET /admin/ingredients
   */
  async getAllIngredients(req, res, next) {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const ingredients = await RecipeService.getAllIngredients({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return response.success(
        res,
        ingredients,
        'Lấy danh sách nguyên liệu thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ingredient by ID
   * GET /admin/ingredients/:id
   */
  async getIngredientById(req, res, next) {
    try {
      const { id } = req.params;

      const ingredient = await RecipeService.getIngredientById(id);

      return response.success(res, ingredient, 'Lấy nguyên liệu thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new ingredient
   * POST /admin/ingredients
   */
  async createIngredient(req, res, next) {
    try {
      const { name, unit_type, unit } = req.body;

      const ingredient = await RecipeService.createIngredient(
        name,
        unit_type,
        unit
      );

      return response.success(
        res,
        ingredient,
        'Tạo nguyên liệu thành công',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ingredient
   * PUT /admin/ingredients/:id
   */
  async updateIngredient(req, res, next) {
    try {
      const { id } = req.params;
      const { name, unit_type, unit } = req.body;

      const ingredient = await RecipeService.updateIngredient(
        id,
        name,
        unit_type,
        unit
      );

      return response.success(
        res,
        ingredient,
        'Cập nhật nguyên liệu thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ingredient
   * DELETE /admin/ingredients/:id
   */
  async deleteIngredient(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RecipeService.deleteIngredient(id);

      return response.success(res, result, 'Xóa nguyên liệu thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search ingredients
   * GET /admin/ingredients/search
   */
  async searchIngredients(req, res, next) {
    try {
      const { keyword, limit = 50, offset = 0 } = req.query;

      if (!keyword) {
        return response.error(res, 'Vui lòng cung cấp từ khóa tìm kiếm', 400);
      }

      const ingredients = await RecipeService.searchIngredients(keyword, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return response.success(
        res,
        ingredients,
        'Tìm kiếm nguyên liệu thành công'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IngredientController();
