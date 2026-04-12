const express = require("express");
const router = express.Router();

const OrderController = require("../controllers/OrderController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const validate = require("../middlewares/validate");
const {
  checkoutOrderSchema,
  validateDiscountSchema,
} = require("../validators/orderValidator");
const { optionalAuth, authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management endpoints
 */

/**
 * @swagger
 * /orders/validate-discount:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Validate discount code
 *     description: Validate a discount code and get discount details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: DISCOUNT10
 *               totalPrice:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Discount validated successfully
 *       400:
 *         description: Invalid or expired discount code
 */

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Checkout order
 *     description: Create and checkout an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     sizeId:
 *                       type: integer
 *                     toppingIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *               discountCode:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, cash, payos]
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get my orders
 *     description: Retrieve paginated list of current user's orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /orders/my-orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get my order detail
 *     description: Retrieve detailed information of a specific order
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
 *         description: Order details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Cancel order
 *     description: Cancel a pending or confirmed order
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
 *         description: Order cancelled successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Order cannot be cancelled (already completed or cancelled)
 */

/**
 * @swagger
 * /orders/payos-return:
 *   post:
 *     tags:
 *       - Orders
 *     summary: PayOS return callback
 *     description: Handle PayOS payment callback and update order status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               orderCode:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */

router.post(
  "/validate-discount",
  optionalAuth,
  validate(validateDiscountSchema),
  AsyncMiddleware(OrderController.validateDiscount)
);

router.post(
  "/checkout",
  optionalAuth,
  validate(checkoutOrderSchema),
  AsyncMiddleware(OrderController.checkout)
);

router.get(
  "/my-orders",
  authenticate,
  AsyncMiddleware(OrderController.getMyOrders)
);

router.get(
  "/my-orders/:id",
  authenticate,
  AsyncMiddleware(OrderController.getMyOrderDetail)
);

router.get(
  "/admin/list",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(OrderController.getAllOrders)
);

router.get(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.STAFF, ROLES_STRING.MANAGER]),
  AsyncMiddleware(OrderController.getOrderDetailByStaff)
);

// Nhận callback từ frontend sau khi PayOS redirect, lưu mã giao dịch vào DB
router.post(
  "/payos-return",
  AsyncMiddleware(OrderController.payosReturn)
);

// Cập nhật món trong đơn thanh toán sau (pay-later)
router.put(
  "/:id/items",
  authenticate,
  authorize([ROLES_STRING.STAFF, ROLES_STRING.MANAGER]),
  AsyncMiddleware(OrderController.updateOrderItems)
);

module.exports = router;
