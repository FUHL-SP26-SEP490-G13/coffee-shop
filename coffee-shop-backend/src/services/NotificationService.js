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

    const userIds = managers.map((user) => user.id);

    const notification = await NotificationRepository.createNotification(
      notificationData
    );
    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      users: managers,
      recipients,
    };
  }

  async createForBaristas(notificationData) {
    const baristas = await UserRepository.findByRole(ROLES.BARISTA);

    if (!baristas.length) return null;

    const userIds = baristas.map((user) => user.id);

    const notification = await NotificationRepository.createNotification(
      notificationData
    );

    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      users: baristas,
      recipients,
    };
  }
  /*
  const result = await NotificationService.createForBaristas({
  type: "new_order",
  title: "Đơn hàng mới",
  message: "Có đơn hàng mới cần pha chế",
  link: "/barista/orders",
  entity_type: "order",
  entity_id: order.id,
});
  */

  async createForCustomers(notificationData) {
    const customers = await UserRepository.findByRole(ROLES.CUSTOMER);

    if (!customers.length) return null;

    const userIds = customers.map((user) => user.id);

    const notification = await NotificationRepository.createNotification(
      notificationData
    );

    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      users: customers,
      recipients,
    };
  }

  async createForStaffs(notificationData) {
    const staffs = await UserRepository.findByRole(ROLES.STAFF);

    if (!staffs.length) return null;

    const userIds = staffs.map((user) => user.id);

    const notification = await NotificationRepository.createNotification(
      notificationData
    );

    const recipients = await NotificationRepository.addRecipients(
      notification.id,
      userIds
    );

    return {
      notification,
      users: staffs,
      recipients,
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
