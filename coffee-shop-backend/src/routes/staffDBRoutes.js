const express = require("express");
const router = express.Router();
const controller = require("../controllers/StaffDBController");
const { authenticate } = require("../middlewares/auth");
const { isStaff } = require("../middlewares/authorize");

// Cấp quyền cho Staff/Barista/Manager (thông qua isStaff role)
router.get("/overview", authenticate, isStaff, controller.getOverview);

module.exports = router;
