const express = require("express");
const router = express.Router();

const VoucherController = require("../controllers/VoucherController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

/*
  Manager only
*/

router.get("/", authenticate, authorize(["manager"]), VoucherController.getAll);

router.get(
  "/:id",
  authenticate,
  authorize(["manager"]),
  VoucherController.getById
);

router.post(
  "/",
  authenticate,
  authorize(["manager"]),
  VoucherController.create
);

router.put(
  "/:id",
  authenticate,
  authorize(["manager"]),
  VoucherController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize(["manager"]),
  VoucherController.delete
);

module.exports = router;
