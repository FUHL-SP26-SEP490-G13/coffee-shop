const express = require('express');
const router = express.Router();

const CartController = require('../controllers/CartController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, CartController.getMyCart);
router.put('/sync', authenticate, CartController.replaceCart);
router.post('/merge', authenticate, CartController.mergeCart);

/**
 * @swagger
 * tags:
 *   - name: Cart API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /cart/:
 *   get:
 *     tags:
 *       - Cart API
 *     summary: Get resource
 *     description: Auto-generated documentation for existing route
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

/**
 * @swagger
 * /cart/sync:
 *   put:
 *     tags:
 *       - Cart API
 *     summary: Update sync
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

/**
 * @swagger
 * /cart/merge:
 *   post:
 *     tags:
 *       - Cart API
 *     summary: Create merge
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