const express = require("express");
const router = express.Router();
const controller = require("../controllers/AttendanceSettingController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

const MANAGER_ONLY = [ROLES_STRING.MANAGER];

router.get("/",
  authenticate,
  authorize(MANAGER_ONLY),
  AsyncMiddleware(controller.getSetting));

router.put("/",
  authenticate,
  authorize(MANAGER_ONLY),
  AsyncMiddleware(controller.updateSetting));

module.exports = router;
