const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class ToppingRepository extends BaseRepository {
  constructor() {
    super('toppings');
  }

  /**
   * Get all active toppings (not deleted)
   */
  async findAllActive(options = {}) {
    const { limit, offset, orderBy = 'name', order = 'ASC' } = options;

    let query = `SELECT * FROM ${this.tableName} WHERE is_deleted = 0`;
    const params = [];

    query += ` ORDER BY ${orderBy} ${order}`;

    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset || 0);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Find topping by name
   */
  async findByName(name) {
    const query = `SELECT * FROM ${this.tableName} WHERE name = ? AND is_deleted = 0`;
    const [rows] = await db.query(query, [name]);
    return rows[0] || null;
  }

  /**
   * Search toppings by name
   */
  async search(keyword, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE name LIKE ? AND is_deleted = 0
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;

    const searchPattern = `%${keyword}%`;
    const [rows] = await db.query(query, [searchPattern, limit, offset]);
    return rows;
  }
}

module.exports = new ToppingRepository();
