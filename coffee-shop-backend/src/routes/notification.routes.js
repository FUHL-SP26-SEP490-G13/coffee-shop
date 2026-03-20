const express = require("express");
const router = express.Router();
const controller = require("../controllers/NotificationController");
const { authenticate } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: User notification management endpoints
 */

/**
 * @swagger
 * /notifications/me:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get my notifications
 *     description: Retrieve all notifications for current user
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
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/me/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread notification count
 *     description: Get count of unread notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/me/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark all as read
 *     description: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/me/unread-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark all as unread
 *     description: Mark all notifications as unread
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as unread
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/me/{recipientId}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /notifications/me/{recipientId}/unread:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as unread
 *     description: Mark specific notification as unread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as unread
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

router.get("/me", authenticate, controller.getMine.bind(controller));
router.get(
  "/me/unread-count",
  authenticate,
  controller.getUnreadCount.bind(controller)
);
router.patch(
  "/me/read-all",
  authenticate,
  controller.markAllAsRead.bind(controller)
);
router.patch(
  "/me/unread-all",
  authenticate,
  controller.markAllAsUnread.bind(controller)
);
router.patch(
  "/me/:recipientId/read",
  authenticate,
  controller.markAsRead.bind(controller)
);
router.patch(
  "/me/:recipientId/unread",
  authenticate,
  controller.markAsUnread.bind(controller)
);

module.exports = router;
