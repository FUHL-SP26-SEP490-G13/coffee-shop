const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');
const validate = require('../middlewares/validate');
const {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  searchIngredientSchema,
} = require('../validators/recipeValidator');

/**
 * Public routes - Get ingredients
 */

// Get all ingredients
router.get('/', RecipeController.getAllIngredients);

// Search ingredients
router.get(
  '/search',
  validate(searchIngredientSchema, 'query'),
  RecipeController.searchIngredients
);

// Get ingredient by ID
router.get(
  '/:id',
  validate(ingredientIdSchema, 'params'),
  RecipeController.getIngredientById
);

/**
 * Ingredient management - Admin only
 */

// Create new ingredient
router.post(
  '/',
  // authenticate,
  // authorize(['admin']),
  validate(createIngredientSchema),
  RecipeController.createIngredient
);

// Update ingredient
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  validate(updateIngredientSchema),
  RecipeController.updateIngredient
);

// Delete ingredient
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  RecipeController.deleteIngredient
);

module.exports = router;
