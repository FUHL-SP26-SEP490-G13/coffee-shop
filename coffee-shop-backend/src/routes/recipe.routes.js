const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createRecipeSchema,
  updateRecipeSchema,
  recipeIdSchema,
  productSizeIdSchema,
  productIdSchema,
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  searchIngredientSchema,
} = require('../validators/recipeValidator');

/**
 * Public routes - Get recipes and ingredients
 */

// Get all recipes for a product size
router.get(
  '/by-size/:productSizeId',
  validate(productSizeIdSchema, 'params'),
  RecipeController.getRecipesByProductSize
);

// Get recipes for a product organized by size
router.get(
  '/product/:productId/by-size',
  validate(productIdSchema, 'params'),
  RecipeController.getRecipesByProductGroupedBySize
);

// Get all recipes for a product
router.get(
  '/product/:productId',
  validate(productIdSchema, 'params'),
  RecipeController.getRecipesByProduct
);

// Get single recipe by ID
router.get(
  '/:id',
  validate(recipeIdSchema, 'params'),
  RecipeController.getRecipeById
);

// Get all ingredients
router.get('/ingredients', RecipeController.getAllIngredients);

// Search ingredients
router.get(
  '/ingredients/search',
  validate(searchIngredientSchema, 'query'),
  RecipeController.searchIngredients
);

// Get ingredient by ID
router.get(
  '/ingredients/:id',
  validate(ingredientIdSchema, 'params'),
  RecipeController.getIngredientById
);

/**
 * Protected routes - Admin/Barista only
 */

// Create new recipe
router.post(
  '/',
  // authenticate,
  // authorize(['admin', 'barista']),
  validate(createRecipeSchema),
  RecipeController.createRecipe
);

// Update recipe
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin', 'barista']),
  validate(recipeIdSchema, 'params'),
  validate(updateRecipeSchema),
  RecipeController.updateRecipe
);

// Delete recipe
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin', 'barista']),
  validate(recipeIdSchema, 'params'),
  RecipeController.deleteRecipe
);

/**
 * Ingredient management - Admin only
 */

// Create new ingredient
router.post(
  '/ingredients',
  // authenticate,
  // authorize(['admin']),
  validate(createIngredientSchema),
  RecipeController.createIngredient
);

// Update ingredient
router.put(
  '/ingredients/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  validate(updateIngredientSchema),
  RecipeController.updateIngredient
);

// Delete ingredient
router.delete(
  '/ingredients/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  RecipeController.deleteIngredient
);

module.exports = router;
