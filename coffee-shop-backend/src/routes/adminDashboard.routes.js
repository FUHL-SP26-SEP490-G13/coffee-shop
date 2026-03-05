const express = require("express");
const router = express.Router();

const AdminDashboardController = require("../controllers/AdminDashboardController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../config/role");

// /api/dashboard
router.get(
  "/",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getOverview
);

// /api/dashboard/revenue?days=7
router.get(
  "/revenue",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getRevenueSeries
);

// /api/dashboard/top-products?days=7&limit=5
router.get(
  "/top-products",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getTopProducts
);

// /api/dashboard/payment-method?days=7
router.get(
  "/payment-method",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getPaymentMethodBreakdown
);

module.exports = router;
