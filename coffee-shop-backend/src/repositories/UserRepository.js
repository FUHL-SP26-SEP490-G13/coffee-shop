const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = ?`;
    const [rows] = await db.query(query, [email]);
    return rows[0] || null;
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone) {
    const query = `SELECT * FROM ${this.tableName} WHERE phone = ?`;
    const [rows] = await db.query(query, [phone]);
    return rows[0] || null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    const query = `SELECT * FROM ${this.tableName} WHERE username = ?`;
    const [rows] = await db.query(query, [username]);
    return rows[0] || null;
  }

  /**
   * Get user with role information
   */
  async findByIdWithRole(userId) {
    const query = `
      SELECT 
        u.*,
        r.role_name,
        r.id as role_id
      FROM ${this.tableName} u
      JOIN role r ON u.role_id = r.id
      WHERE u.id = ?
    `;

    const [rows] = await db.query(query, [userId]);
    return rows[0] || null;
  }

  /**
   * Get user with addresses
   */
  async findByIdWithAddresses(userId) {
    const query = `
      SELECT 
        u.*,
        r.role_name,
        JSON_ARRAYAGG(
          CASE 
            WHEN a.id IS NOT NULL THEN
              JSON_OBJECT(
                'id', a.id,
                'receiver_name', a.receiver_name,
                'receiver_phone', a.receiver_phone,
                'address', a.address,
                'is_default', a.is_default,
                'address_type', a.address_type
              )
            ELSE NULL
          END
        ) as addresses
      FROM ${this.tableName} u
      JOIN role r ON u.role_id = r.id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_deleted = 0
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const [rows] = await db.query(query, [userId]);
    if (rows[0]) {
      // Filter out null addresses
      rows[0].addresses = rows[0].addresses.filter(addr => addr !== null);
    }
    return rows[0] || null;
  }

  /**
   * Get all users by role
   */
  async findByRole(roleId, options = {}) {
    const { limit, offset, orderBy = 'created_at', order = 'DESC' } = options;

    let query = `
      SELECT 
        u.*,
        r.role_name
      FROM ${this.tableName} u
      JOIN role r ON u.role_id = r.id
      WHERE u.role_id = ? AND u.isActive = 1
      ORDER BY ${orderBy} ${order}
    `;

    const params = [roleId];

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset || 0);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Search users
   */
  async search(keyword, options = {}) {
    const { limit = 20, offset = 0, roleId = null } = options;

    let query = `
      SELECT 
        u.*,
        r.role_name
      FROM ${this.tableName} u
      JOIN role r ON u.role_id = r.id
      WHERE (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR 
        u.phone LIKE ? OR
        u.username LIKE ?
      )
      AND u.isActive = 1
    `;

    const params = [];
    const searchPattern = `%${keyword}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);

    if (roleId) {
      query += ` AND u.role_id = ?`;
      params.push(roleId);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const allowedFields = [
      'first_name',
      'last_name',
      'gender',
      'dob',
      'address',
      'phone',
    ];

    // Filter only allowed fields
    const updateData = {};
    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = data[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId);
    }

    return this.update(userId, updateData);
  }

  /**
   * Update password
   */
  async updatePassword(userId, hashedPassword) {
    const query = `UPDATE ${this.tableName} SET password = ? WHERE id = ?`;
    await db.query(query, [hashedPassword, userId]);
    return true;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(userId) {
    const query = `UPDATE ${this.tableName} SET isActive = 0 WHERE id = ?`;
    const [result] = await db.query(query, [userId]);
    return result.affectedRows > 0;
  }

  /**
   * Activate user
   */
  async activate(userId) {
    const query = `UPDATE ${this.tableName} SET isActive = 1 WHERE id = ?`;
    const [result] = await db.query(query, [userId]);
    return result.affectedRows > 0;
  }

  /**
   * Check if email exists (exclude current user)
   */
  async emailExists(email, excludeUserId = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ?`;
    const params = [email];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }

  /**
   * Check if phone exists (exclude current user)
   */
  async phoneExists(phone, excludeUserId = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE phone = ?`;
    const params = [phone];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }

  /**
   * Check if username exists (exclude current user)
   */
  async usernameExists(username, excludeUserId = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE username = ?`;
    const params = [username];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  }

  /**
   * Get user statistics (for admin dashboard)
   */
  async getUserStats() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role_id = 4 THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN role_id IN (2, 3) THEN 1 ELSE 0 END) as staff
      FROM ${this.tableName}
    `;

    const [rows] = await db.query(query);
    return rows[0];
  }
}

module.exports = new UserRepository();
