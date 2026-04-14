const express = require("express");
const router = express.Router();

const controller = require("../controllers/BaristaDBController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

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
