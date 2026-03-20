const express = require("express");
const router = express.Router();
const FavoriteController = require("../controllers/FavoriteController");
const { authenticate } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   - name: Favorites
 *     description: Product favorites/wishlist management endpoints
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get my favorites
 *     description: Retrieve all favorite products for current user
 *     security:
 *       - bearerAuth: []
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
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Add product to favorites
 *     description: Add a product to current user's favorites list
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
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product added to favorites
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         description: Product already in favorites
 */

/**
 * @swagger
 * /favorites/check/{productId}:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Check if product is favorite
 *     description: Check if a product is in current user's favorites
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
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /favorites/{productId}:
 *   delete:
 *     tags:
 *       - Favorites
 *     summary: Remove product from favorites
 *     description: Remove a product from current user's favorites list
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
 *         description: Product removed from favorites
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Product not in favorites
 */

router.get("/", authenticate, FavoriteController.getMyFavorites);
router.get("/check/:productId", authenticate, FavoriteController.checkFavorite);
router.post("/", authenticate, FavoriteController.addFavorite);
router.delete("/:productId", authenticate, FavoriteController.removeFavorite);

module.exports = router;
