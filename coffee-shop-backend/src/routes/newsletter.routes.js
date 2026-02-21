const express = require("express");
const router = express.Router();
const controller = require("../controllers/NewsletterController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

// PUBLIC
router.post("/", controller.subscribe.bind(controller));

// ADMIN
router.get(
  "/admin",
  authenticate,
  authorize(["manager"]),
  controller.getAll.bind(controller)
);

router.delete(
  "/admin/:id",
  authenticate,
  authorize(["manager"]),
  controller.delete.bind(controller)
);

module.exports = router;
