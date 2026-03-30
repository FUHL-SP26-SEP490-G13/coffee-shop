const express = require("express");
const router = express.Router();

const controller = require("../controllers/AppSettingController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

router.get("/", controller.getAll.bind(controller));

router.put(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.upsert.bind(controller)
);

module.exports = router;
