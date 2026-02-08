const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('category');
  }

  /**
   * Get all active categories (not deleted)
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
   * Find category by name
   */
  async findByName(name) {
    const query = `SELECT * FROM ${this.tableName} WHERE name = ? AND is_deleted = 0`;
    const [rows] = await db.query(query, [name]);
    return rows[0] || null;
  }

  /**
   * Get category with product count
   */
  async findByIdWithProductCount(id) {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM category c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available'
      WHERE c.id = ? AND c.is_deleted = 0
      GROUP BY c.id
    `;

    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get all categories with product count
   */
  async findAllWithProductCount() {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM category c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available'
      WHERE c.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    const [rows] = await db.query(query);
    return rows;
  }

  /**
   * Check if category has products
   */
  async hasProducts(categoryId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM products 
      WHERE category_id = ?
    `;

    const [rows] = await db.query(query, [categoryId]);
    return rows[0].count > 0;
  }

  /**
   * Search categories by name
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

module.exports = new CategoryRepository();
