const db = require("../config/database");

class NotificationRepository {
  async createNotification(data) {
    const { type, title, message, link, entity_type, entity_id } = data;

    const sql = `
      INSERT INTO notifications (type, title, message, link, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      type,
      title,
      message,
      link || null,
      entity_type || null,
      entity_id || null,
    ]);

    const [rows] = await db.query("SELECT * FROM notifications WHERE id = ?", [
      result.insertId,
    ]);

    return rows[0];
  }

  async addRecipients(notificationId, userIds) {
    if (!userIds || userIds.length === 0) return [];

    const recipients = [];

    for (const userId of userIds) {
      const [result] = await db.query(
        `
        INSERT INTO notification_recipients (notification_id, user_id)
        VALUES (?, ?)
        `,
        [notificationId, userId]
      );

      const [rows] = await db.query(
        "SELECT * FROM notification_recipients WHERE id = ?",
        [result.insertId]
      );

      recipients.push(rows[0]);
    }

    return recipients;
  }

  async getNotificationsByUser(userId) {
    const sql = `
      SELECT
        nr.id AS recipient_id,
        nr.user_id,
        nr.is_read,
        nr.read_at,
        n.id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.entity_type,
        n.entity_id,
        n.created_at
      FROM notification_recipients nr
      INNER JOIN notifications n ON nr.notification_id = n.id
      WHERE nr.user_id = ?
      ORDER BY nr.created_at DESC
    `;

    const [rows] = await db.query(sql, [userId]);
    return rows;
  }

  async countUnreadByUser(userId) {
    const sql = `
      SELECT COUNT(*) AS total
      FROM notification_recipients
      WHERE user_id = ? AND is_read = 0
    `;

    const [rows] = await db.query(sql, [userId]);
    return rows[0].total;
  }

  async markAsRead(recipientId, userId) {
    const sql = `
      UPDATE notification_recipients
      SET is_read = 1, read_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await db.query(sql, [recipientId, userId]);
  }

  async markAllAsRead(userId) {
    const sql = `
      UPDATE notification_recipients
      SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0
    `;

    await db.query(sql, [userId]);
  }

  async markAsUnread(recipientId, userId) {
    const sql = `
    UPDATE notification_recipients
    SET is_read = 0, read_at = NULL
    WHERE id = ? AND user_id = ?
  `;

    await db.query(sql, [recipientId, userId]);
  }

  async markAllAsUnread(userId) {
    const sql = `
    UPDATE notification_recipients
    SET is_read = 0, read_at = NULL
    WHERE user_id = ? AND is_read = 1
  `;

    await db.query(sql, [userId]);
  }
}

module.exports = new NotificationRepository();
