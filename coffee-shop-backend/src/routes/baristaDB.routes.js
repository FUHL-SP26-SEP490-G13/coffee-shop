const express = require("express");
const router = express.Router();

const controller = require("../controllers/BaristaDBController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   - name: Barista Dashboard
 *     description: Barista workspace and order management endpoints
 */

/**
 * @swagger
 * /barista/dashboard:
 *   get:
 *     tags:
 *       - Barista Dashboard
 *     summary: Get barista dashboard overview
 *     description: Retrieve barista dashboard with current order status and metrics
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved
 */

/**
 * @swagger
 * /barista/dashboard/trends:
 *   get:
 *     tags:
 *       - Barista Dashboard
 *     summary: Get order trends
 *     description: Retrieve order preparation time trends and statistics
 *     responses:
 *       200:
 *         description: Trends data retrieved
 */

/**
 * @swagger
 * /barista/dashboard/active-orders:
 *   get:
 *     tags:
 *       - Barista Dashboard
 *     summary: Get active orders
 *     description: Retrieve currently active orders being prepared
 *     responses:
 *       200:
 *         description: Active orders retrieved
 */

/**
 * @swagger
 * /barista/dashboard/delayed-orders:
 *   get:
 *     tags:
 *       - Barista Dashboard
 *     summary: Get delayed orders
 *     description: Retrieve orders that are delayed or overdue
 *     responses:
 *       200:
 *         description: Delayed orders retrieved
 */

/**
 * @swagger
 * /barista/dashboard/top-products:
 *   get:
 *     tags:
 *       - Barista Dashboard
 *     summary: Get top products today
 *     description: Retrieve most prepared products today
 *     responses:
 *       200:
 *         description: Top products retrieved
 */

router.get(
  "/dashboard",
  authenticate,
  authorize([ROLES_STRING.BARISTA]),
  controller.getOverview
);

router.get(
  "/dashboard/trends",
  authenticate,
  authorize([ROLES_STRING.BARISTA]),
  controller.getTrends
);

router.get(
  "/dashboard/active-orders",
  authenticate,
  authorize([ROLES_STRING.BARISTA, ROLES_STRING.STAFF, ROLES_STRING.MANAGER]),
  controller.getActiveOrders
);

router.get(
  "/dashboard/delayed-orders",
  authenticate,
  authorize([ROLES_STRING.BARISTA]),
  controller.getDelayedOrders
);

router.get(
  "/dashboard/top-products",
  authenticate,
  authorize([ROLES_STRING.BARISTA]),
  controller.getTopProductsToday
);

router.put(
  "/orders/:id/status",
  authenticate,
  authorize([ROLES_STRING.BARISTA, ROLES_STRING.MANAGER, ROLES_STRING.STAFF]),
  controller.updateStatus
);

module.exports = router;
