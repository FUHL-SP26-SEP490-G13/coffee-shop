const express = require("express");
const router = express.Router();

const AdminDBController = require("../controllers/AdminDBController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Admin dashboard and analytics endpoints
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard overview
 *     description: Retrieve admin dashboard overview with key metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /dashboard/revenue:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get revenue series
 *     description: Retrieve revenue data over time period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to retrieve
 *     responses:
 *       200:
 *         description: Revenue data retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/top-products:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get top products
 *     description: Retrieve best selling products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Top products retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/payment-method:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get payment method breakdown
 *     description: Get revenue breakdown by payment method
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Payment method breakdown retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/order-type:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get revenue by order type
 *     description: Get revenue breakdown by order type (dine-in, takeaway, delivery)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Order type revenue retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/comparison:
 *     tags:
 *       - Dashboard
 *     summary: Get comparison metrics
 *     description: Get period comparison metrics for analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparison data retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/staff-summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get staff summary
 *     description: Get staff count by role
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff summary retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /dashboard/table-status:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get table status
 *     description: Get status of all dining tables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Table status retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

// /api/dashboard
router.get(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getOverview
);

// /api/dashboard/revenue?days=7
router.get(
  "/revenue",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getRevenueSeries
);

// /api/dashboard/top-products?days=7&limit=5
router.get(
  "/top-products",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getTopProducts
);

// /api/dashboard/order-type?days=7 doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
router.get(
  "/order-type",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getOrderTypeRevenue
);

// Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
router.get(
  "/comparison",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getComparison
);

// /api/dashboard/payment-method
router.get(
  "/payment-method",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getPaymentMethodRevenue
);

// /api/dashboard/orders-summary
router.get(
  "/orders-summary",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getOrdersSummary
);

router.get(
  "/detailed-report",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AdminDBController.getDetailedOrdersReport
);

module.exports = router;
