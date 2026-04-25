const RecipeRepository = require('../repositories/RecipeRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class RecipeService {
  /**
   * Get recipes for a specific product size
   */
  async getRecipesByProductSize(productSizeId) {
    const recipes = await RecipeRepository.getRecipesByProductSize(
      productSizeId
    );

    if (recipes.length === 0) {
      return [];
    }

    return recipes;
  }

  /**
   * Get recipes organized by product size
   */
  async getRecipesByProductGroupedBySize(productId) {
    const rows = await RecipeRepository.getRecipesByProductGroupedBySize(
      productId
    );

    if (rows.length === 0) {
      return {
        product_id: productId,
        sizes: {},
      };
    }

    // Group recipes by size
    const grouped = {};

    rows.forEach((row) => {
      const size = row.size;

      if (!grouped[size]) {
        grouped[size] = {
          product_size_id: row.product_size_id,
          product_id: row.product_id,
          size: row.size,
          price: row.price,
          recipes: [],
        };
      }

      // Only add recipe if it exists (has a recipe_id)
      if (row.recipe_id) {
        grouped[size].recipes.push({
          id: row.recipe_id,
          ingredient_id: row.ingredient_id,
          quantity: row.quantity,
          ingredient_name: row.ingredient_name,
          unit_type: row.unit_type,
          unit: row.unit,
        });
      }
    });

    return {
      product_id: productId,
      sizes: grouped,
    };
  }

  /**
   * Get all recipes for a product
   */
  async getRecipesByProduct(productId) {
    return RecipeRepository.getRecipesByProduct(productId);
  }

  /**
   * Get single recipe
   */
  async getRecipeById(recipeId) {
    const recipe = await RecipeRepository.getRecipeById(recipeId);

    if (!recipe) {
      throw new ErrorResponse(404, 'Công thức không tồn tại');
    }

    return recipe;
  }

  /**
   * Create recipe
   */
  async createRecipe(productSizeId, ingredientId, quantity) {
    if (Number(quantity) <= 0) {
      throw new ErrorResponse(400, 'Số lượng nguyên liệu phải lớn hơn 0');
    }

    // Check if ingredient exists
    const ingredient = await RecipeRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new ErrorResponse(404, 'Nguyên liệu không tồn tại');
    }

    // Check if recipe already exists
    const exists = await RecipeRepository.recipeExists(
      productSizeId,
      ingredientId
    );
    if (exists) {
      const existingQuantity = Number(exists.quantity || 0);
      const incomingQuantity = Number(quantity || 0);

      // Keep idempotent behavior: same quantity should not be accumulated.
      if (existingQuantity === incomingQuantity) {
        return RecipeRepository.getRecipeById(exists.id);
      }

      const mergedQuantity = existingQuantity + incomingQuantity;
      return RecipeRepository.updateRecipe(exists.id, ingredientId, mergedQuantity);
    }

    const recipe = await RecipeRepository.createRecipe(
      productSizeId,
      ingredientId,
      quantity
    );

    return recipe;
  }

  /**
   * Update recipe
   */
  async updateRecipe(recipeId, ingredientId, quantity) {
    if (Number(quantity) <= 0) {
      throw new ErrorResponse(400, 'Số lượng nguyên liệu phải lớn hơn 0');
    }

    // Check if recipe exists
    const recipe = await RecipeRepository.getRecipeById(recipeId);
    if (!recipe) {
      throw new ErrorResponse(404, 'Công thức không tồn tại');
    }

    // Check if ingredient exists
    const ingredient = await RecipeRepository.getIngredientById(ingredientId);
    if (!ingredient) {
      throw new ErrorResponse(404, 'Nguyên liệu không tồn tại');
    }

    return RecipeRepository.updateRecipe(recipeId, ingredientId, quantity);
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(recipeId) {
    const recipe = await RecipeRepository.getRecipeById(recipeId);
    if (!recipe) {
      throw new ErrorResponse(404, 'Công thức không tồn tại');
    }

    const deleted = await RecipeRepository.deleteRecipe(recipeId);

    if (!deleted) {
      throw new ErrorResponse(500, 'Không thể xóa công thức');
    }

    return { id: recipeId };
  }

  /**
   * Get all ingredients
   */
  async getAllIngredients(options = {}) {
    return RecipeRepository.getAllIngredients(options);
  }

  /**
   * Get ingredient by ID
   */
  async getIngredientById(ingredientId) {
    const ingredient = await RecipeRepository.getIngredientById(ingredientId);

    if (!ingredient) {
      throw new ErrorResponse(404, 'Nguyên liệu không tồn tại');
    }

    return ingredient;
  }

  /**
   * Create ingredient
   */
  async createIngredient(name, unitType, unit) {
    if (!name || name.trim() === '') {
      throw new ErrorResponse(400, 'Tên nguyên liệu không được để trống');
    }
    
    // Check for duplicate name (optional, assuming search returns exact match or DB throws error, we'll throw 400)
    const existing = await RecipeRepository.searchIngredients(name);
    if (existing && existing.data && existing.data.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        throw new ErrorResponse(400, 'Tên nguyên liệu đã tồn tại');
    }

    return RecipeRepository.createIngredient(name, unitType, unit);
  }

  /**
   * Update ingredient
   */
  async updateIngredient(ingredientId, name, unitType, unit) {
    if (!name || name.trim() === '') {
      throw new ErrorResponse(400, 'Tên nguyên liệu không được để trống');
    }

    const ingredient = await RecipeRepository.getIngredientById(ingredientId);

    if (!ingredient) {
      throw new ErrorResponse(404, 'Nguyên liệu không tồn tại');
    }

    const existing = await RecipeRepository.searchIngredients(name);
    if (existing && existing.data && existing.data.some(i => i.name.toLowerCase() === name.toLowerCase() && i.id !== ingredientId)) {
        throw new ErrorResponse(400, 'Tên nguyên liệu đã tồn tại');
    }

    return RecipeRepository.updateIngredient(
      ingredientId,
      name,
      unitType,
      unit
    );
  }

  /**
   * Delete ingredient
   */
  async deleteIngredient(ingredientId) {
    const ingredient = await RecipeRepository.getIngredientById(ingredientId);

    if (!ingredient) {
      throw new ErrorResponse(404, 'Nguyên liệu không tồn tại');
    }

    const deleted = await RecipeRepository.deleteIngredient(ingredientId);

    if (!deleted) {
      throw new ErrorResponse(500, 'Không thể xóa nguyên liệu');
    }

    return { id: ingredientId };
  }

  /**
   * Search ingredients
   */
  async searchIngredients(keyword, options = {}) {
    return RecipeRepository.searchIngredients(keyword, options);
  }
}

module.exports = new RecipeService();
