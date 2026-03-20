const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  searchCategorySchema,
} = require('../validators/categoryValidator');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Product category management endpoints
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve list of all product categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create new category
 *     description: Create a new product category with image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Coffee
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by ID
 *     description: Retrieve detailed information of a specific category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update category
 *     description: Update category information and image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete category
 *     description: Soft delete a product category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /categories/{id}/restore:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Restore deleted category
 *     description: Restore a soft-deleted category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category restored successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * Public routes
 */

// Get all categories
router.get('/', CategoryController.getAll);

// Search categories
// router.get(
//   '/search',
//   validate(searchCategorySchema, 'query'),
//   CategoryController.search,
// );

// Get category by ID
router.get(
  '/:id',
  validate(categoryIdSchema, 'params'),
  CategoryController.getById,
);

// Create new category
router.post(
  '/',
  // authenticate,
  // authorize(['manager']),
  upload.single('image'),
  validate(createCategorySchema),
  CategoryController.create,
);

// Update category
router.put(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  upload.single('image'),
  validate(updateCategorySchema),
  CategoryController.update,
);

// Delete category
router.delete(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  CategoryController.delete,
);

// Restore deleted category
router.post(
  '/:id/restore',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  CategoryController.restore,
);

module.exports = router;
