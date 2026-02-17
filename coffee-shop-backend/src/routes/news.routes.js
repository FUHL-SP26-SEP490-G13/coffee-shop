const express = require("express");
const router = express.Router();

const NewsController = require("../controllers/NewsController");

const { authenticate } = require("../middlewares/auth"); 
const { authorize } = require("../middlewares/authorize");

const upload = require("../middlewares/upload");

// =====================
// PUBLIC ROUTES
// =====================

router.get("/featured", NewsController.getFeatured);
router.get("/", NewsController.getAll);
router.get("/:slug", NewsController.getDetail);

// =====================
// PROTECTED ROUTES
// =====================

router.post(
  "/",
  authenticate,
  authorize(["manager"]),
  upload.single("thumbnail"),
  NewsController.create
);

router.get(
  "/admin",
  authenticate,
  authorize(["manager"]),
  NewsController.getAllAdmin
);

router.delete(
  "/:id",
  authenticate,
  authorize(["manager"]),
  NewsController.delete
);

router.put(
  "/:id",
  authenticate,
  authorize(["manager"]),
  NewsController.update
);

module.exports = router;
