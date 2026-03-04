const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/DiscountController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { createDiscountSchema } = require("../validators/discountValidator");

/*
  Manager only
*/

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
  validate(createDiscountSchema),
  DiscountController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(["manager"]),
  DiscountController.delete
);

module.exports = router;
