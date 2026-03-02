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
      const { product_size_id, ingredient_id, quantity } = req.body;

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
   * DELETE /api/recipes/:id
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

  /**
   * Get all ingredients
   * GET /api/recipes/ingredients
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
   * GET /api/recipes/ingredients/:id
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
   * POST /api/recipes/ingredients
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
   * PUT /api/recipes/ingredients/:id
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
   * DELETE /api/recipes/ingredients/:id
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
   * GET /api/recipes/ingredients/search
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

module.exports = new RecipeController();
