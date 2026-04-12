const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const parseJsonFields = require('../middlewares/parseJsonFields');
const asyncMiddleware = require('../middlewares/async.middleware')
const { ROLES_STRING } = require('../config/constants');

const MANAGER_ONLY = [ROLES_STRING.MANAGER];
const ALL_STAFF = [ROLES_STRING.MANAGER, ROLES_STRING.STAFF, ROLES_STRING.BARISTA];

const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  searchProductSchema,
} = require('../validators/productValidator');

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management endpoints
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve paginated list of all products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags:
 *       - Products
 *     summary: Create new product
 *     description: Create a new product with images (multipart/form-data)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Espresso
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 25000
 *               categoryId:
 *                 type: integer
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: object
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /products/search:
 *   get:
 *     tags:
 *       - Products
 *     summary: Search products
 *     description: Search products by name or keyword
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
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
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get products by category
 *     description: Retrieve all products in a specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /products/best-sellers:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get best seller products
 *     description: Retrieve top selling products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Best sellers retrieved successfully
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: Retrieve detailed information of a specific product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Products
 *     summary: Update product
 *     description: Update product information and images
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
 *               price:
 *                 type: number
 *                 format: float
 *               categoryId:
 *                 type: integer
 *               sizes:
 *                 type: array
 *               deleteSizeIds:
 *                 type: array
 *               deleteImageIds:
 *                 type: array
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete product
 *     description: Soft delete a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /products/{id}/sizes:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product sizes
 *     description: Retrieve available sizes for a specific product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product sizes retrieved successfully
 */

/**
 * Public routes
 */

// Get all products
router.get('/', ProductController.getAll);

// Search products (phải đặt trước /:id để tránh conflict)
router.get('/search', validate(searchProductSchema, 'query'), ProductController.search);

// Get products by category
router.get('/category/:categoryId', ProductController.getByCategory);

// Get sizes by product ID
// router.get('/:id/sizes', validate(productIdSchema, 'params'), ProductController.getSizesByProductId);

router.get("/best-sellers", ProductController.getBestSellers);

// Get product by ID
router.get('/:id', validate(productIdSchema, 'params'), ProductController.getById);


// Create new product
router.post(
  '/',
  authenticate,
  authorize(MANAGER_ONLY),
  upload.array('images', 5), // Max 5 images
  validate(createProductSchema),
  ProductController.create
);

// Update product
router.put(
  '/:id',
  authenticate,
  authorize(MANAGER_ONLY),
  validate(productIdSchema, 'params'),
  upload.array('images', 5), // Max 5 images
  parseJsonFields(['sizes', 'deleteSizeIds', 'deleteImageIds']),
  validate(updateProductSchema),
  ProductController.update
);

// Delete product
router.delete(
  '/:id',
  authenticate,
  authorize(MANAGER_ONLY),
  validate(productIdSchema, 'params'),
  ProductController.delete
);

// Restore deleted product

// router.post(
//   '/:id/restore',
//   authenticate,
//   authorize(['admin']),
//   validate(productIdSchema, 'params'),
//   ProductController.restore
// );

/**
 * @swagger
 * tags:
 *   - name: Product API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /products/:
 *   get:
 *     tags:
 *       - Product API
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
 * /products/:
 *   post:
 *     tags:
 *       - Product API
 *     summary: Create resource
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
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