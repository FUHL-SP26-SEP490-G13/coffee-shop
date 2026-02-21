const express = require("express");
const router = express.Router();

const controller = require("../controllers/BannerController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const upload = require("../middlewares/upload");

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
  upload.single("image"),
  controller.create.bind(controller)
);

router.put(
  "/admin/:id",
  authenticate,
  authorize(["manager"]),
  upload.single("image"),
  controller.update.bind(controller)
);

router.delete(
  "/admin/:id",
  authenticate,
  authorize(["manager"]),
  controller.delete.bind(controller)
);

module.exports = router;
