const express = require("express");
const router = express.Router();
const controller = require("../controllers/BaristaDashboardController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../config/role");

router.get(
  "/dashboard",
  authenticate,
  authorize([ROLES.BARISTA]),
  controller.getOverview
);

router.get(
  "/dashboard/trends",
  authenticate,
  authorize([ROLES.BARISTA]),
  controller.getTrends
);

module.exports = router;
