const express = require("express");
const router = express.Router();

const AdminDBController = require("../controllers/AdminDBController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

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
