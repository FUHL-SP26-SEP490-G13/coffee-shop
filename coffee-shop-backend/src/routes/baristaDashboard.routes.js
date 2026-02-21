const express = require("express");
const router = express.Router();
const controller = require("../controllers/BaristaDashboardController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

router.get(
  "/dashboard",
  authenticate,
  authorize(["barista"]),
  controller.getOverview
);

router.get(
  "/dashboard/trends",
  authenticate,
  authorize(["barista"]),
  controller.getTrends
);

module.exports = router;
