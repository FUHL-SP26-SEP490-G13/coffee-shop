const express = require("express");
const router = express.Router();

const OrderController = require("../controllers/OrderController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const validate = require("../middlewares/validate");
const { checkoutOrderSchema } = require("../validators/orderValidator");
const { optionalAuth, authenticate } = require("../middlewares/auth");

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

module.exports = router;
