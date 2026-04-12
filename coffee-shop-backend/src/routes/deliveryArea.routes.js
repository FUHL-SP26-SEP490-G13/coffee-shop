const express = require("express");
const router = express.Router();

const DeliveryAreaController = require("../controllers/DeliveryAreaController");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const {
  createProvinceSchema,
  listWardsQuerySchema,
  wardIdParamSchema,
  createWardSchema,
  updateWardSchema,
} = require("../validators/deliveryAreaValidator");

router.get("/provinces", DeliveryAreaController.getProvinces);
router.post(
  "/provinces",
  authenticate,
  authorize(["manager"]),
  validate(createProvinceSchema),
  DeliveryAreaController.createProvince
);

router.get(
  "/wards",
  validate(listWardsQuerySchema, "query"),
  DeliveryAreaController.getWards
);

router.post(
  "/wards",
  authenticate,
  authorize(["manager"]),
  validate(createWardSchema),
  DeliveryAreaController.createWard
);

router.put(
  "/wards/:id",
  authenticate,
  authorize(["manager"]),
  validate(wardIdParamSchema, "params"),
  validate(updateWardSchema),
  DeliveryAreaController.updateWard
);

module.exports = router;
