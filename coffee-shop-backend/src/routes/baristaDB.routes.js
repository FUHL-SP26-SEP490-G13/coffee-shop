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

module.exports = router;
