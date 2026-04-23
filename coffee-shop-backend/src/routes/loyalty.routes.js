const express = require("express");
const router = express.Router();

const LoyaltyController = require("../controllers/LoyaltyController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

router.get(
  "/me",
  authenticate,
  AsyncMiddleware(LoyaltyController.getMyLoyalty)
);

router.get(
  "/me/transactions",
  authenticate,
  AsyncMiddleware(LoyaltyController.getMyTransactions)
);

router.get(
  "/admin/customers",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.listCustomers)
);

router.get(
  "/admin/users/:userId",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.getCustomerDetail)
);

router.get(
  "/admin/users/:userId/transactions",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.getCustomerTransactions)
);

router.post(
  "/admin/users/:userId/adjust",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.adjustCustomerPoints)
);

module.exports = router;
