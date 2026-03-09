const NotificationRepository = require("../repositories/NotificationRepository");
const UserRepository = require("../repositories/UserRepository");
const { ROLES } = require("../config/constants");

class NotificationService {
  async createForUsers(notificationData, userIds) {
    const notification = await NotificationRepository.createNotification(
      notificationData
    );
    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      recipients,
    };
  }

  async createForRole(roleId, notificationData) {
    const users = await UserRepository.findByRole(roleId);
    const userIds = users.map((user) => user.id);

    if (!userIds.length) return null;

    const notification = await NotificationRepository.createNotification(
      notificationData
    );
    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      users,
      recipients,
    };
  }

  async createForManager(notificationData) {
    const managers = await UserRepository.findByRole(ROLES.MANAGER);

    if (!managers.length) return null;

    const manager = managers[0];
    const notification = await NotificationRepository.createNotification(
      notificationData
    );
    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      [manager.id]
    );

    return {
      notification,
      user: manager,
      recipient: recipients[0],
    };
  }

  async getMyNotifications(userId) {
    return NotificationRepository.getNotificationsByUser(userId);
  }

  async getMyUnreadCount(userId) {
    return NotificationRepository.countUnreadByUser(userId);
  }

  async markAsRead(recipientId, userId) {
    return NotificationRepository.markAsRead(recipientId, userId);
  }

  async markAllAsRead(userId) {
    return NotificationRepository.markAllAsRead(userId);
  }

  async markAsUnread(recipientId, userId) {
    return NotificationRepository.markAsUnread(recipientId, userId);
  }

  async markAllAsUnread(userId) {
    return NotificationRepository.markAllAsUnread(userId);
  }
}

module.exports = new NotificationService();
