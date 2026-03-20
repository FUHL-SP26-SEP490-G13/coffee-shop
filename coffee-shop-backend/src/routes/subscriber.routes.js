const express = require("express");
const router = express.Router();
const controller = require("../controllers/SubscriberController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   - name: Subscribers
 *     description: Newsletter subscription management endpoints
 */

/**
 * @swagger
 * /subscriber:
 *   post:
 *     tags:
 *       - Subscribers
 *     summary: Subscribe to newsletter
 *     description: Subscribe email to newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Subscription successful
 *       400:
 *         description: Invalid email or already subscribed
 *   get:
 *     tags:
 *       - Subscribers
 *     summary: Get all subscribers
 *     description: Retrieve list of all newsletter subscribers (admin only)
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
 *         description: Subscribers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /subscriber/{id}:
 *   delete:
 *     tags:
 *       - Subscribers
 *     summary: Remove subscriber
 *     description: Remove a subscriber from the newsletter (admin only)
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
 *         description: Subscriber removed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// PUBLIC
router.post("/", controller.subscribe.bind(controller));

// ADMIN
router.get(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.getAll.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.delete.bind(controller)
);

module.exports = router;
