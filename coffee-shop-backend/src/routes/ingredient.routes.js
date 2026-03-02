const express = require('express');
const router = express.Router();
const IngredientController = require('../controllers/IngredientController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  searchIngredientSchema,
} = require('../validators/recipeValidator');

/**
 * ADMIN ROUTES - Manage ingredients
 */

// Get all ingredients
router.get(
  '/',
  IngredientController.getAllIngredients
);

// Search ingredients
router.get(
  '/search',
  validate(searchIngredientSchema, 'query'),
  IngredientController.searchIngredients
);

// Get ingredient by ID
router.get(
  '/:id',
  validate(ingredientIdSchema, 'params'),
  IngredientController.getIngredientById
);

// Create new ingredient
router.post(
  '/',
  // authenticate,
  // authorize(['admin']),
  validate(createIngredientSchema),
  IngredientController.createIngredient
);

// Update ingredient
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  validate(updateIngredientSchema),
  IngredientController.updateIngredient
);

// Delete ingredient
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(ingredientIdSchema, 'params'),
  IngredientController.deleteIngredient
);

module.exports = router;
