const express = require("express");
const router = express.Router();
const controller = require("../controllers/NewsletterController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

// PUBLIC
router.post("/", controller.subscribe.bind(controller));

// ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.getAll.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.delete.bind(controller)
);

module.exports = router;
