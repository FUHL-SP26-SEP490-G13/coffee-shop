const db = require("../config/database");
const { ROLES } = require("../config/constants");

class LoyaltyRepository {
  async getConnection() {
    return db.getConnection();
  }

  async ensureWallet(connection, userId) {
    await connection.query(
      `
      INSERT INTO user_loyalties (user_id, total_points, lifetime_points)
      VALUES (?, 0, 0)
      ON DUPLICATE KEY UPDATE user_id = user_id
      `,
      [userId]
    );
  }

  async getWalletByUserId(userId, { connection = null, forUpdate = false } = {}) {
    const executor = connection || db;
    const lockClause = forUpdate && connection ? " FOR UPDATE" : "";

    const [rows] = await executor.query(
      `
      SELECT user_id, total_points, lifetime_points, updated_at
      FROM user_loyalties
      WHERE user_id = ?
      LIMIT 1${lockClause}
      `,
      [userId]
    );

    return rows[0] || null;
  }

  async updateWalletPoints(
    connection,
    userId,
    { totalPointsDelta = 0, lifetimePointsDelta = 0 } = {}
  ) {
    await connection.query(
      `
      UPDATE user_loyalties
      SET total_points = total_points + ?,
          lifetime_points = lifetime_points + ?
      WHERE user_id = ?
      `,
      [Number(totalPointsDelta), Number(lifetimePointsDelta), userId]
    );
  }

  async createTransaction(
    connection,
    { userId, type, points, source, referenceId = null }
  ) {
    const [result] = await connection.query(
      `
      INSERT INTO point_transactions (user_id, type, points, source, reference_id)
      VALUES (?, ?, ?, ?, ?)
      `,
      [userId, type, points, source, referenceId]
    );

    return result.insertId;
  }

  async findTransaction(
    connection,
    { userId, type, source, referenceId = null }
  ) {
    const [rows] = await connection.query(
      `
      SELECT id, user_id, type, points, source, reference_id, created_at
      FROM point_transactions
      WHERE user_id = ?
        AND type = ?
        AND source = ?
        AND ((reference_id IS NULL AND ? IS NULL) OR reference_id = ?)
      LIMIT 1
      `,
      [userId, type, source, referenceId, referenceId]
    );

    return rows[0] || null;
  }

  async findOrderSnapshot(orderId, { connection = null, forUpdate = false } = {}) {
    const executor = connection || db;
    const lockClause = forUpdate && connection ? " FOR UPDATE" : "";

    const [rows] = await executor.query(
      `
      SELECT id, user_id, status, total_amount, used_points
      FROM orders
      WHERE id = ?
      LIMIT 1${lockClause}
      `,
      [orderId]
    );

    return rows[0] || null;
  }

  async listTransactionsByUser(userId, { limit = 20, offset = 0, type = null } = {}) {
    let query = `
      SELECT
        id,
        type,
        points,
        source,
        reference_id,
        created_at,
        CASE
          WHEN type = 'SPEND' THEN -points
          WHEN type = 'ADJUST' AND source LIKE 'ADMIN_DECREASE%' THEN -points
          ELSE points
        END AS signed_points
      FROM point_transactions
      WHERE user_id = ?
    `;

    const params = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(query, params);
    return rows;
  }

  async countTransactionsByUser(userId, { type = null } = {}) {
    let query = `
      SELECT COUNT(*) AS total
      FROM point_transactions
      WHERE user_id = ?
    `;

    const params = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    const [rows] = await db.query(query, params);
    return Number(rows[0]?.total || 0);
  }

  async listCustomerLoyalties({ keyword = null, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.phone,
        COALESCE(ul.total_points, 0) AS total_points,
        COALESCE(ul.lifetime_points, 0) AS lifetime_points,
        ul.updated_at
      FROM users u
      LEFT JOIN user_loyalties ul ON ul.user_id = u.id
      WHERE u.role_id = ?
        AND u.isActive = 1
    `;

    const params = [ROLES.CUSTOMER];

    if (keyword) {
      query += `
        AND (
          u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR u.username LIKE ?
          OR u.email LIKE ?
          OR u.phone LIKE ?
        )
      `;

      const search = `%${keyword}%`;
      params.push(search, search, search, search, search);
    }

    query += `
      ORDER BY COALESCE(ul.total_points, 0) DESC, u.id DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(query, params);
    return rows;
  }

  async countCustomerLoyalties({ keyword = null } = {}) {
    let query = `
      SELECT COUNT(*) AS total
      FROM users u
      WHERE u.role_id = ?
        AND u.isActive = 1
    `;

    const params = [ROLES.CUSTOMER];

    if (keyword) {
      query += `
        AND (
          u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR u.username LIKE ?
          OR u.email LIKE ?
          OR u.phone LIKE ?
        )
      `;
      const search = `%${keyword}%`;
      params.push(search, search, search, search, search);
    }

    const [rows] = await db.query(query, params);
    return Number(rows[0]?.total || 0);
  }
}

module.exports = new LoyaltyRepository();
