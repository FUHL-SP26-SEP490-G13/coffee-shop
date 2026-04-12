const express = require("express");
const router = express.Router();

const NewsController = require("../controllers/NewsController");

const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

const upload = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const { createNewsSchema } = require("../validators/newsValidator");
const { ROLES_STRING } = require("../config/constants");
const NewsAIController = require("../controllers/NewsAIController");

/**
 * @swagger
 * tags:
 *   - name: News
 *     description: News/Article management endpoints
 */

/**
 * @swagger
 * /news/featured:
 *   get:
 *     tags:
 *       - News
 *     summary: Get featured news
 *     description: Retrieve featured/highlighted news articles
 *     responses:
 *       200:
 *         description: Featured news retrieved successfully
 */

/**
 * @swagger
 * /news:
 *   get:
 *     tags:
 *       - News
 *     summary: Get all news
 *     description: Retrieve paginated list of published news articles
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: News retrieved successfully
 *   post:
 *     tags:
 *       - News
 *     summary: Create news
 *     description: Create a new news article (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: News created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /news/admin:
 *   get:
 *     tags:
 *       - News
 *     summary: Get all news (admin)
 *     description: Retrieve all news articles including drafts (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: News retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     tags:
 *       - News
 *     summary: Delete news
 *     description: Delete a news article (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: News deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags:
 *       - News
 *     summary: Update news
 *     description: Update a news article (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: News updated successfully
 */

/**
 * @swagger
 * /news/admin/{id}:
 *   get:
 *     tags:
 *       - News
 *     summary: Get news detail (admin)
 *     description: Retrieve detailed news article (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: News detail retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /news/related:
 *   get:
 *     tags:
 *       - News
 *     summary: Get related news
 *     description: Retrieve related news articles
 *     parameters:
 *       - in: query
 *         name: newsId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Related news retrieved
 */

/**
 * @swagger
 * /news/{slug}:
 *   get:
 *     tags:
 *       - News
 *     summary: Get news by slug
 *     description: Retrieve published news article by URL slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News detail retrieved
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /news/ai/suggest-by-title:
 *   post:
 *     tags:
 *       - News
 *     summary: Suggest content by title (AI)
 *     description: Generate news content suggestion using AI based on title
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content suggestion generated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /news/ai/suggest-by-summary:
 *   post:
 *     tags:
 *       - News
 *     summary: Suggest content by summary (AI)
 *     description: Generate full content from summary using AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content suggestion generated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

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
  authorize([ROLES_STRING.MANAGER]),
  upload.single("thumbnail"),
  validate(createNewsSchema),
  NewsController.create
);

router.get(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  NewsController.getAllAdmin
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  NewsController.delete
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  upload.single("thumbnail"),
  validate(createNewsSchema),
  NewsController.update
);

router.get(
  "/admin/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  NewsController.getById
);
router.get("/related", NewsController.getRelated);

router.post(
  "/ai/suggest-by-title",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  NewsAIController.suggestByTitle
);

router.post(
  "/ai/suggest-by-summary",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  NewsAIController.suggestContentBySummary
);

router.get("/:slug", NewsController.getDetail);

/**
 * @swagger
 * tags:
 *   - name: News API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /news/:
 *   get:
 *     tags:
 *       - News API
 *     summary: Get resource
 *     description: Auto-generated documentation for existing route
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /news/:
 *   post:
 *     tags:
 *       - News API
 *     summary: Create resource
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
