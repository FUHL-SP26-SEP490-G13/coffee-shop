const express = require("express");
const router = express.Router();
const controller = require("../controllers/NewsletterController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../config/constants");

// PUBLIC
router.post("/", controller.subscribe.bind(controller));

// ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES.MANAGER]),
  controller.getAll.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  controller.delete.bind(controller)
);

module.exports = router;
