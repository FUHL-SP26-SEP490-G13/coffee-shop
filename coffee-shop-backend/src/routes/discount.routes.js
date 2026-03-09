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
router.get(
  "/",
  authenticate,
  authorize(["manager"]),
  DiscountController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize(["manager"]),
  DiscountController.getById
);

router.post(
  "/",
  authenticate,
  authorize(["manager"]),
  validate(createDiscountSchema),
  DiscountController.create
);

router.put(
  "/:id",
  authenticate,
  authorize(["manager"]),
  validate(updateDiscountSchema),
  DiscountController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(["manager"]),
  DiscountController.delete
);

module.exports = router;
