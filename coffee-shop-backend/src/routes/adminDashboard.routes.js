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

// /api/dashboard/order-type?days=7 doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
router.get(
  "/order-type",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getOrderTypeRevenue
);

// Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
router.get(
  "/comparison",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getComparison
);

// Optional: tóm tắt số lượng nhân viên theo vai trò (barista, phục vụ, quản lý) để dashboard có thêm vài số liệu hữu ích
router.get(
  "/staff-summary",
  authenticate,
  authorize([ROLES.MANAGER]),
  AdminDashboardController.getStaffSummary
);

router.get("/table-status", authenticate, authorize([ROLES.MANAGER]), AdminDashboardController.getTableStatus);
module.exports = router;
