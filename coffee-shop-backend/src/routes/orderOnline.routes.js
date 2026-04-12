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

module.exports = router;
