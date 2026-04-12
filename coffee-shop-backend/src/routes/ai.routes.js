const express = require("express");
const router = express.Router();
const AiController = require("../controllers/AiController");

router.post("/chat", AiController.chat);

/**
 * @swagger
 * tags:
 *   - name: Ai API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     tags:
 *       - Ai API
 *     summary: Create chat
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;