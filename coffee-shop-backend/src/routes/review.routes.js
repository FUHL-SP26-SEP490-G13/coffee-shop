const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authenticate } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Product review management endpoints
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get reviews by product
 *     description: Retrieve all reviews for a specific product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /reviews/me/{productId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get my review for product
 *     description: Retrieve current user's review for a specific product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No review found
 */

/**
 * @swagger
 * /reviews/:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: Create or update review
 *     description: Create a new review or update existing review for a product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       200:
 *         description: Review updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /reviews/:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get all my reviews
 *     description: Retrieve all reviews created by current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

router.get("/product/:productId", ReviewController.getByProductId);
router.get("/me/:productId", authenticate, ReviewController.getMyReview);
router.post("/", authenticate, ReviewController.createOrUpdate);

router.get("/", authenticate, ReviewController.getAll);

module.exports = router;
