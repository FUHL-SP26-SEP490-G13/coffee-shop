const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/DashboardController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

// /api/dashboard
router.get(
  "/",
  authenticate,
  authorize(["manager"]),
  DashboardController.getOverview
);

// /api/dashboard/revenue?days=7
router.get(
  "/revenue",
  authenticate,
  authorize(["manager"]),
  DashboardController.getRevenueSeries
);

// /api/dashboard/top-products?days=7&limit=5
router.get(
  "/top-products",
  authenticate,
  authorize(["manager"]),
  DashboardController.getTopProducts
);

// /api/dashboard/payment-method?days=7
router.get(
  "/payment-method",
  authenticate,
  authorize(["manager"]),
  DashboardController.getPaymentMethodBreakdown
);

module.exports = router;
