const express = require("express");
const router = express.Router();

const controller = require("../controllers/BannerController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const upload = require("../middlewares/upload");
const ROLES = require("../config/role");
const validate = require("../middlewares/validate");
const {
  createBannerSchema,
  updateBannerSchema,
} = require("../validators/bannerValidation");

// PUBLIC
router.get("/active", controller.getActive.bind(controller));

// ADMIN
router.get(
  "/admin",
  authenticate,
  authorize([ROLES.MANAGER]),
  controller.getAll.bind(controller)
);

router.post(
  "/admin",
  authenticate,
  authorize([ROLES.MANAGER]),
  upload.single("image"),
  validate(createBannerSchema),
  controller.create.bind(controller)
);

router.put(
  "/admin/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  upload.single("image"),
  validate(updateBannerSchema),
  controller.update.bind(controller)
);

router.delete(
  "/admin/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  controller.delete.bind(controller)
);

module.exports = router;
