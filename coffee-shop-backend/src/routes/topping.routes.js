const express = require('express');
const publicRouter = express.Router();
const adminRouter = express.Router();
const ToppingController = require('../controllers/ToppingController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createToppingSchema,
  updateToppingSchema,
  toppingIdSchema,
  searchToppingSchema,
} = require('../validators/toppingValidator');

/**
 * @swagger
 * tags:
 *   - name: Toppings
 *     description: Topping management endpoints
 */

/**
 * @swagger
 * /toppings:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: Get all toppings
 *     description: Retrieve list of all available toppings
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Toppings retrieved successfully
 */

/**
 * @swagger
 * /toppings/search:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: Search toppings
 *     description: Search toppings by name or keyword
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */

/**
 * @swagger
 * /toppings/{id}:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: Get topping by ID
 *     description: Retrieve detailed information of a specific topping
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topping found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admin/toppings:
 *   post:
 *     tags:
 *       - Toppings
 *     summary: Create topping
 *     description: Create a new topping (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Topping created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /admin/toppings/{id}:
 *   put:
 *     tags:
 *       - Toppings
 *     summary: Update topping
 *     description: Update an existing topping (admin only)
 *     security:
 *       - bearerAuth: []
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
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Topping updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Toppings
 *     summary: Delete topping
 *     description: Delete a topping (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topping deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admin/toppings/{id}/restore:
 *   post:
 *     tags:
 *       - Toppings
 *     summary: Restore deleted topping
 *     description: Restore a soft-deleted topping
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topping restored successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * Public routes
 */

// Get all toppings
publicRouter.get(
  '/',
  ToppingController.getAll
);

// Search toppings
publicRouter.get(
  '/search',
  validate(searchToppingSchema, 'query'),
  ToppingController.search
);

// Get topping by ID
publicRouter.get(
  '/:id',
  validate(toppingIdSchema, 'params'),
  ToppingController.getById
);

/**
 * Admin only routes
 */

// Create new topping
adminRouter.post(
  '/',
  authenticate,
  // authorize(['admin']),
  validate(createToppingSchema),
  ToppingController.create
);

// Update topping
adminRouter.put(
  '/:id',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  validate(updateToppingSchema),
  ToppingController.update
);

// Delete topping
adminRouter.delete(
  '/:id',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.delete
);

// Restore deleted topping
adminRouter.post(
  '/:id/restore',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.restore
);

module.exports = {
  publicToppingRoutes: publicRouter,
  adminToppingRoutes: adminRouter,
};
