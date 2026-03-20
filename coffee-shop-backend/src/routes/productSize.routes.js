const express = require('express');
const router = express.Router();
const ProductSizeController = require('../controllers/ProductSizeController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { productIdSchema, productSizeIdSchema } = require('../validators/productSizeValidator');

/**
 * @swagger
 * tags:
 *   - name: Product Sizes
 *     description: Product size management endpoints
 */

/**
 * @swagger
 * /product-sizes/product/{productId}:
 *   get:
 *     tags:
 *       - Product Sizes
 *     summary: Get sizes by product
 *     description: Retrieve all available sizes for a specific product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sizes retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /product-sizes:
 *   post:
 *     tags:
 *       - Product Sizes
 *     summary: Create product size
 *     description: Add a new size to a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - size
 *               - price
 *             properties:
 *               productId:
 *                 type: integer
 *               size:
 *                 type: string
 *                 example: "M"
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product size created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /product-sizes/{id}:
 *   get:
 *     tags:
 *       - Product Sizes
 *     summary: Get product size by ID
 *     description: Retrieve detailed information of a product size
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product size found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Product Sizes
 *     summary: Update product size
 *     description: Update product size information (admin only)
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
 *               size:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product size updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Product Sizes
 *     summary: Delete product size
 *     description: Delete a product size (admin only)
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
 *         description: Product size deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// Lấy tất cả size của 1 sản phẩm
router.get('/product/:productId', validate(productIdSchema, 'params'), ProductSizeController.getByProductId);

// Lấy 1 size theo id
router.get('/:id', validate(productSizeIdSchema, 'params'), ProductSizeController.getById);

// Thêm mới size cho sản phẩm
router.post('/', authenticate, authorize(['admin']), ProductSizeController.create);

// Cập nhật size
router.put('/:id', authenticate, authorize(['admin']), ProductSizeController.update);

// Xóa size
router.delete('/:id', authenticate, authorize(['admin']), ProductSizeController.delete);

module.exports = router;
