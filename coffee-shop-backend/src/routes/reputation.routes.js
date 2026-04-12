const express = require("express");
const router = express.Router();

const ReputationController = require("../controllers/ReputationController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const { optionalAuth, authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

router.get(
  "/by-phone",
  optionalAuth,
  AsyncMiddleware(ReputationController.getReputationByPhone),
);

router.get(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(ReputationController.getAdminReputationProfiles),
);

router.get(
  "/admin/:phone/history",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(ReputationController.getAdminReputationHistory),
);

module.exports = router;
