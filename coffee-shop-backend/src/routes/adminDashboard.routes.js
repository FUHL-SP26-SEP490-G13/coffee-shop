const express = require("express");
const router = express.Router();

const AdminDashboardController = require("../controllers/AdminDashboardController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

// /api/dashboard
router.get(
  "/",
  authenticate,
  authorize(["manager"]),
  AdminDashboardController.getOverview
);

// /api/dashboard/revenue?days=7
router.get(
  "/revenue",
  authenticate,
  authorize(["manager"]),
  AdminDashboardController.getRevenueSeries
);

// /api/dashboard/top-products?days=7&limit=5
router.get(
  "/top-products",
  authenticate,
  authorize(["manager"]),
  AdminDashboardController.getTopProducts
);

// /api/dashboard/payment-method?days=7
router.get(
  "/payment-method",
  authenticate,
  authorize(["manager"]),
  AdminDashboardController.getPaymentMethodBreakdown
);

module.exports = router;
