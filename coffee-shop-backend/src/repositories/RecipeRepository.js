const db = require('../config/database');

class RecipeRepository {
  /**
   * Get all recipes by product size with ingredient details
   */
  async getRecipesByProductSize(productSizeId) {
    const query = `
      SELECT 
        rbs.id,
        rbs.product_size_id,
        rbs.ingredient_id,
        rbs.quantity,
        i.id as ingredient_id_data,
        i.name as ingredient_name,
        i.unit_type,
        i.unit,
        ps.product_id,
        ps.size
      FROM recipes_by_size rbs
      LEFT JOIN ingredient i ON rbs.ingredient_id = i.id AND i.is_deleted = 0
      LEFT JOIN product_sizes ps ON rbs.product_size_id = ps.id
      WHERE rbs.product_size_id = ? AND i.is_deleted = 0
      ORDER BY i.name ASC
    `;

    const [rows] = await db.query(query, [productSizeId]);
    return rows;
  }

  /**
   * Get all recipes for a product (all sizes)
   */
  async getRecipesByProduct(productId) {
    const query = `
      SELECT 
        rbs.id,
        rbs.product_size_id,
        rbs.ingredient_id,
        rbs.quantity,
        i.id as ingredient_id_data,
        i.name as ingredient_name,
        i.unit_type,
        i.unit,
        ps.product_id,
        ps.size,
        ps.price
      FROM recipes_by_size rbs
      LEFT JOIN ingredient i ON rbs.ingredient_id = i.id AND i.is_deleted = 0
      LEFT JOIN product_sizes ps ON rbs.product_size_id = ps.id
      WHERE ps.product_id = ? AND ps.is_deleted = 0 AND i.is_deleted = 0
      ORDER BY ps.size ASC, i.name ASC
    `;

    const [rows] = await db.query(query, [productId]);
    return rows;
  }

  /**
   * Get recipes organized by product size
   */
  async getRecipesByProductGroupedBySize(productId) {
    const query = `
      SELECT 
        ps.id as product_size_id,
        ps.product_id,
        ps.size,
        ps.price,
        rbs.id as recipe_id,
        rbs.ingredient_id,
        rbs.quantity,
        i.id as ingredient_id_data,
        i.name as ingredient_name,
        i.unit_type,
        i.unit
      FROM product_sizes ps
      LEFT JOIN recipes_by_size rbs ON ps.id = rbs.product_size_id
      LEFT JOIN ingredient i ON rbs.ingredient_id = i.id AND i.is_deleted = 0
      WHERE ps.product_id = ? AND ps.is_deleted = 0
      ORDER BY ps.size ASC, i.name ASC
    `;

    const [rows] = await db.query(query, [productId]);
    return rows;
  }

  /**
   * Get single recipe by ID
   */
  async getRecipeById(recipeId) {
    const query = `
      SELECT 
        rbs.id,
        rbs.product_size_id,
        rbs.ingredient_id,
        rbs.quantity,
        i.id as ingredient_id_data,
        i.name as ingredient_name,
        i.unit_type,
        i.unit,
        ps.product_id,
        ps.size,
        ps.price
      FROM recipes_by_size rbs
      LEFT JOIN ingredient i ON rbs.ingredient_id = i.id
      LEFT JOIN product_sizes ps ON rbs.product_size_id = ps.id
      WHERE rbs.id = ?
    `;

    const [rows] = await db.query(query, [recipeId]);
    return rows[0] || null;
  }

  /**
   * Create new recipe
   */
  async createRecipe(productSizeId, ingredientId, quantity) {
    const query = `
      INSERT INTO recipes_by_size (product_size_id, ingredient_id, quantity)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.query(query, [productSizeId, ingredientId, quantity]);

    return {
      id: result.insertId,
      product_size_id: productSizeId,
      ingredient_id: ingredientId,
      quantity: quantity,
    };
  }

  /**
   * Update recipe
   */
  async updateRecipe(recipeId, ingredientId, quantity) {
    const query = `
      UPDATE recipes_by_size 
      SET ingredient_id = ?, quantity = ?
      WHERE id = ?
    `;

    await db.query(query, [ingredientId, quantity, recipeId]);

    return this.getRecipeById(recipeId);
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(recipeId) {
    const query = `DELETE FROM recipes_by_size WHERE id = ?`;
    const [result] = await db.query(query, [recipeId]);
    return result.affectedRows > 0;
  }

  /**
   * Check if recipe exists
   */
  async recipeExists(productSizeId, ingredientId) {
    const query = `
      SELECT id FROM recipes_by_size 
      WHERE product_size_id = ? AND ingredient_id = ?
      LIMIT 1
    `;

    const [rows] = await db.query(query, [productSizeId, ingredientId]);
    return rows.length > 0;
  }

  /**
   * Get all ingredients (not deleted)
   */
  async getAllIngredients(options = {}) {
    const { limit = 100, offset = 0, orderBy = 'name', order = 'ASC' } = options;

    let query = `
      SELECT * FROM ingredient 
      WHERE is_deleted = 0
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [limit, offset]);
    return rows;
  }

  /**
   * Get ingredient by ID
   */
  async getIngredientById(ingredientId) {
    const query = `SELECT * FROM ingredient WHERE id = ? AND is_deleted = 0`;
    const [rows] = await db.query(query, [ingredientId]);
    return rows[0] || null;
  }

  /**
   * Create ingredient
   */
  async createIngredient(name, unitType, unit) {
    const query = `
      INSERT INTO ingredient (name, unit_type, unit)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.query(query, [name, unitType, unit]);

    return {
      id: result.insertId,
      name,
      unit_type: unitType,
      unit,
      is_deleted: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Update ingredient
   */
  async updateIngredient(ingredientId, name, unitType, unit) {
    const query = `
      UPDATE ingredient 
      SET name = ?, unit_type = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.query(query, [name, unitType, unit, ingredientId]);

    return this.getIngredientById(ingredientId);
  }

  /**
   * Soft delete ingredient
   */
  async deleteIngredient(ingredientId) {
    const query = `
      UPDATE ingredient 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.query(query, [ingredientId]);
    return result.affectedRows > 0;
  }

  /**
   * Search ingredients by name
   */
  async searchIngredients(keyword, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT * FROM ingredient 
      WHERE name LIKE ? AND is_deleted = 0
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [`%${keyword}%`, limit, offset]);
    return rows;
  }
}

module.exports = new RecipeRepository();
