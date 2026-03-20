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
} = require('../validators/recipeValidator');

/**
 * @swagger
 * tags:
 *   - name: Recipes
 *     description: Recipe/product formulation endpoints
 */

/**
 * @swagger
 * /recipes/by-size/{productSizeId}:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get recipes by product size
 *     description: Retrieve all recipes/ingredients for a specific product size
 *     parameters:
 *       - in: path
 *         name: productSizeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags:
 *       - Recipes
 *     summary: Create recipe
 *     description: Add ingredients to a product size recipe
 *     parameters:
 *       - in: path
 *         name: productSizeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredientId
 *               - quantity
 *             properties:
 *               ingredientId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 format: float
 *               unit:
 *                 type: string
 *                 example: "ml"
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /recipes/product/{productId}/by-size:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get recipes grouped by size
 *     description: Retrieve all recipes for a product, organized by available sizes
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /recipes/product/{productId}:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get all recipes for product
 *     description: Retrieve all recipes for a specific product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get recipe by ID
 *     description: Retrieve detailed information of a specific recipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Recipes
 *     summary: Update recipe
 *     description: Update recipe ingredients and quantities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredientId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 format: float
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Recipes
 *     summary: Delete recipe
 *     description: Delete a recipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * Post route - must be before GET routes to avoid conflicts
 */
  '/by-size/:productSizeId',
  validate(productSizeIdSchema, 'params'),
  validate(createRecipeSchema),
  RecipeController.createRecipe
;

/**
 * ADMIN ROUTES - Get and manage recipes
  // ...existing code...
} = require('../validators/recipeValidator');

/**
 * Public routes - Get recipes
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

// ...existing code...

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

// ...existing code...

module.exports = router;
