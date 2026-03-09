const express = require("express");
const router = express.Router();

const NewsController = require("../controllers/NewsController");

const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

const upload = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const { createNewsSchema } = require("../validators/newsValidator");
const { ROLES } = require("../config/constants");
const NewsAIController = require("../controllers/NewsAIController");

// =====================
// PUBLIC ROUTES
// =====================

router.get("/featured", NewsController.getFeatured);
router.get("/", NewsController.getAll);

// =====================
// PROTECTED ROUTES
// =====================

router.post(
  "/",
  authenticate,
  authorize([ROLES.MANAGER]),
  upload.single("thumbnail"),
  validate(createNewsSchema),
  NewsController.create
);

router.get(
  "/admin",
  authenticate,
  authorize([ROLES.MANAGER]),
  NewsController.getAllAdmin
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  NewsController.delete
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  upload.single("thumbnail"),
  validate(createNewsSchema),
  NewsController.update
);

router.get(
  "/admin/:id",
  authenticate,
  authorize([ROLES.MANAGER]),
  NewsController.getById
);
router.get("/related", NewsController.getRelated);

router.post(
  "/ai/suggest-by-title",
  authenticate,
  authorize([ROLES.MANAGER]),
  NewsAIController.suggestByTitle
);

router.post(
  "/ai/suggest-by-summary",
  authenticate,
  authorize([ROLES.MANAGER]),
  NewsAIController.suggestContentBySummary
);

router.get("/:slug", NewsController.getDetail);

module.exports = router;
