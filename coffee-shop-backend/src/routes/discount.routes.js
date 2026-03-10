const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/DiscountController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const {
  createDiscountSchema,
  updateDiscountSchema,
} = require("../validators/discountValidator");
const { ROLES_STRING } = require("../config/constants");

router.get(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.getById
);

router.post(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  validate(createDiscountSchema),
  DiscountController.create
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  validate(updateDiscountSchema),
  DiscountController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.delete
);

module.exports = router;
