const express = require('express');
const router = express.Router();
const IngredientController = require('../controllers/IngredientController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const RecipeController = require('../controllers/RecipeController');
const validate = require('../middlewares/validate');
const {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  searchIngredientSchema,
} = require('../validators/recipeValidator');

/**
 * @swagger
 * tags:
 *   - name: Ingredients
 *     description: Product ingredient management endpoints
 */

/**
 * @swagger
 * /ingredients:
 *   get:
 *     tags:
 *       - Ingredients
 *     summary: Get all ingredients
 *     description: Retrieve list of all available ingredients
 *     responses:
 *       200:
 *         description: Ingredients retrieved successfully
 *   post:
 *     tags:
 *       - Ingredients
 *     summary: Create ingredient
 *     description: Create a new ingredient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *                 example: "g"
 *               costPerUnit:
 *                 type: number
 *                 format: float
 *               supplier:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /ingredients/search:
 *   get:
 *     tags:
 *       - Ingredients
 *     summary: Search ingredients
 *     description: Search ingredients by name or keyword
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */

/**
 * @swagger
 * /ingredients/{id}:
 *   get:
 *     tags:
 *       - Ingredients
 *     summary: Get ingredient by ID
 *     description: Retrieve detailed information of a specific ingredient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingredient found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Ingredients
 *     summary: Update ingredient
 *     description: Update an ingredient
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *               costPerUnit:
 *                 type: number
 *               supplier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Ingredients
 *     summary: Delete ingredient
 *     description: Delete an ingredient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingredient deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

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

/**
 * @swagger
 * tags:
 *   - name: Ingredient API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /ingredients/:
 *   get:
 *     tags:
 *       - Ingredient API
 *     summary: Get resource
 *     description: Auto-generated documentation for existing route
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /ingredients/:
 *   post:
 *     tags:
 *       - Ingredient API
 *     summary: Create resource
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
