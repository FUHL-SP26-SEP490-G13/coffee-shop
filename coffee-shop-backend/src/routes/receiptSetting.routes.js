const express = require("express");
const router = express.Router();

const controller = require("../controllers/ReceiptSettingController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const parseJsonFields = require("../middlewares/parseJsonFields");
const {
  upsertReceiptSettingSchema,
} = require("../validators/receiptSettingValidator");

router.get("/", controller.getActive.bind(controller));

router.put(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  upload.single("logo"),
  parseJsonFields(["header_lines", "footer_lines"]),
  validate(upsertReceiptSettingSchema),
  controller.upsertActive.bind(controller)
);

module.exports = router;
