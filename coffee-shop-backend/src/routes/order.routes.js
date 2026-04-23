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
