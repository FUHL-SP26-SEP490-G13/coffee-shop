const RecipeService = require('../services/RecipeService');
const response = require('../utils/response');

class RecipeController {
  /**
   * Get recipes for a specific product size
   * GET /api/recipes/by-size/:productSizeId
   */
  async getRecipesByProductSize(req, res, next) {
    try {
      const { productSizeId } = req.params;

      const recipes = await RecipeService.getRecipesByProductSize(productSizeId);

      return response.success(
        res,
        recipes,
        'Lấy công thức theo kích thước sản phẩm thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipes organized by product size
   * GET /api/recipes/product/:productId/by-size
   */
  async getRecipesByProductGroupedBySize(req, res, next) {
    try {
      const { productId } = req.params;

      const recipes = await RecipeService.getRecipesByProductGroupedBySize(productId);

      return response.success(
        res,
        recipes,
        'Lấy công thức theo sản phẩm và size thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all recipes for a product
   * GET /api/recipes/product/:productId
   */
  async getRecipesByProduct(req, res, next) {
    try {
      const { productId } = req.params;

      const recipes = await RecipeService.getRecipesByProduct(productId);

      return response.success(
        res,
        recipes,
        'Lấy tất cả công thức theo sản phẩm thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single recipe by ID
   * GET /api/recipes/:id
   */
  async getRecipeById(req, res, next) {
    try {
      const { id } = req.params;

      const recipe = await RecipeService.getRecipeById(id);

      return response.success(res, recipe, 'Lấy công thức thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new recipe
   * POST /api/recipes
   */
  async createRecipe(req, res, next) {
    try {
      // Ưu tiên lấy productSizeId từ params nếu có (route mới)
      const product_size_id = req.params.productSizeId || req.body.product_size_id;
      const { ingredient_id, quantity } = req.body;

      const recipe = await RecipeService.createRecipe(
        product_size_id,
        ingredient_id,
        quantity
      );

      return response.success(res, recipe, 'Tạo công thức thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe
   * PUT /api/recipes/:id
   */
  async updateRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const { ingredient_id, quantity } = req.body;

      const recipe = await RecipeService.updateRecipe(
        id,
        ingredient_id,
        quantity
      );

      return response.success(res, recipe, 'Cập nhật công thức thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recipe
   * DELETE /admin/recipes/:id
   */
  async deleteRecipe(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RecipeService.deleteRecipe(id);

      return response.success(res, result, 'Xóa công thức thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecipeController();
