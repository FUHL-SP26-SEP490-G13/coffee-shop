const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/DiscountController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

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
  DiscountController.create
);

router.put(
  "/:id",
  authenticate,
  authorize(["manager"]),
  DiscountController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(["manager"]),
  DiscountController.delete
);

module.exports = router;
