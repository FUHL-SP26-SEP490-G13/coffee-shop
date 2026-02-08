const db = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Find all records
   */
  async findAll(conditions = {}, options = {}) {
    const { limit, offset, orderBy = 'id', order = 'DESC' } = options;

    let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params = [];

    // Build WHERE conditions
    Object.keys(conditions).forEach((key) => {
      query += ` AND ${key} = ?`;
      params.push(conditions[key]);
    });

    query += ` ORDER BY ${orderBy} ${order}`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset || 0);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Find one by ID
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Find one by conditions
   */
  async findOne(conditions = {}) {
    let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params = [];

    Object.keys(conditions).forEach((key) => {
      query += ` AND ${key} = ?`;
      params.push(conditions[key]);
    });

    query += ` LIMIT 1`;

    const [rows] = await db.query(query, params);
    return rows[0] || null;
  }

  /**
   * Create new record
   */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(',')}) 
      VALUES (${placeholders})
    `;

    const [result] = await db.query(query, values);
    return this.findById(result.insertId);
  }

  /**
   * Update record
   */
  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const setClause = keys.map((key) => `${key} = ?`).join(',');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    await db.query(query, [...values, id]);
    return this.findById(id);
  }

  /**
   * Soft delete (set is_deleted = 1)
   */
  async softDelete(id) {
    const query = `UPDATE ${this.tableName} SET is_deleted = 1 WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Hard delete (permanently remove)
   */
  async hardDelete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count records
   */
  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
    const params = [];

    Object.keys(conditions).forEach((key) => {
      query += ` AND ${key} = ?`;
      params.push(conditions[key]);
    });

    const [rows] = await db.query(query, params);
    return rows[0].total;
  }

  /**
   * Check if record exists
   */
  async exists(conditions = {}) {
    const count = await this.count(conditions);
    return count > 0;
  }
}

module.exports = BaseRepository;
