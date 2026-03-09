const express = require("express");
const router = express.Router();
const controller = require("../controllers/NotificationController");
const { authenticate } = require("../middlewares/auth");

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
