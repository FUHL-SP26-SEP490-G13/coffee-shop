const express = require("express");
const router = express.Router();
const controller = require("../controllers/BannerController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

// PUBLIC
router.get("/active", controller.getActive.bind(controller));

// ADMIN
router.get(
  "/admin",
  authenticate,
  authorize(["manager"]),
  controller.getAll.bind(controller)
);

router.post(
  "/admin",
  authenticate,
  authorize(["manager"]),
  controller.create.bind(controller)
);

router.put(
  "/admin/:id",
  authenticate,
  authorize(["manager"]),
  controller.update.bind(controller)
);

module.exports = router;
