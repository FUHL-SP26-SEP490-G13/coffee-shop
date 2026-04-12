const express = require("express");
const router = express.Router();

const OrderOnlineController = require("../controllers/OrderOnlineController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const validate = require("../middlewares/validate");
const {
  checkoutOrderSchema,
  validateDiscountSchema,
} = require("../validators/orderValidator");
const { optionalAuth, authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

const STAFF_CONFIRM_ROLES = [ROLES_STRING.STAFF, ROLES_STRING.MANAGER];

router.post(
  "/validate-discount",
  optionalAuth,
  validate(validateDiscountSchema),
  AsyncMiddleware(OrderOnlineController.validateDiscount)
);

router.post(
  "/checkout",
  optionalAuth,
  validate(checkoutOrderSchema),
  AsyncMiddleware(OrderOnlineController.checkout)
);

router.get(
  "/my-orders",
  authenticate,
  AsyncMiddleware(OrderOnlineController.getMyOrders)
);

router.get(
  "/my-orders/:id",
  authenticate,
  AsyncMiddleware(OrderOnlineController.getMyOrderDetail)
);

router.put(
  "/:id/cancel",
  authenticate,
  AsyncMiddleware(OrderOnlineController.cancel)
);

router.put(
  "/:id/confirm-preparing",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.confirmPreparing)
);

router.get(
  "/:id/staff-detail",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.getDeliveryDetailForStaff)
);

router.put(
  "/:id/staff-cancel",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.cancelDeliveryByStaff)
);

router.put(
  "/:id/print-success",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.markPrintSuccess)
);

router.put(
  "/:id/mark-delivering",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.markDeliveringByStaff)
);

router.put(
  "/:id/staff-cancel-delivering",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.cancelDeliveringByStaff)
);

router.put(
  "/:id/staff-complete-delivery",
  authenticate,
  authorize(STAFF_CONFIRM_ROLES),
  AsyncMiddleware(OrderOnlineController.completeDeliveryByStaff)
);

// Nhận callback từ frontend sau khi PayOS redirect, lưu mã giao dịch vào DB
router.post(
  "/payos-return",
  AsyncMiddleware(OrderOnlineController.payosReturn)
);

/**
 * @swagger
 * tags:
 *   - name: Order Online API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /order-online/validate-discount:
 *   post:
 *     tags:
 *       - Order Online API
 *     summary: Create validate discount
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 * /order-online/checkout:
 *   post:
 *     tags:
 *       - Order Online API
 *     summary: Create checkout
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 * /order-online/my-orders:
 *   get:
 *     tags:
 *       - Order Online API
 *     summary: Get my orders
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
 * /order-online/my-orders/{id}:
 *   get:
 *     tags:
 *       - Order Online API
 *     summary: Get my orders id
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/cancel:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id cancel
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/confirm-preparing:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id confirm preparing
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/staff-detail:
 *   get:
 *     tags:
 *       - Order Online API
 *     summary: Get id staff detail
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/staff-cancel:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id staff cancel
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/print-success:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id print success
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/mark-delivering:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id mark delivering
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/staff-cancel-delivering:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id staff cancel delivering
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/{id}/staff-complete-delivery:
 *   put:
 *     tags:
 *       - Order Online API
 *     summary: Update id staff complete delivery
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /order-online/payos-return:
 *   post:
 *     tags:
 *       - Order Online API
 *     summary: Create payos return
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
