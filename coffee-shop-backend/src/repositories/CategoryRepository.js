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
    return this.findAll(
      { is_deleted: 0 },
      {
        ...options,
        orderBy: options.orderBy || 'name',
        order: options.order || 'ASC',
      },
    );
  }

  /**
   * Find category by name
   */
  async findByName(name) {
    return this.findOne({ name, is_deleted: 0 });
  }

  async findByCode(code) {
    return this.findOne({ code, is_deleted: 0 });
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
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available' AND p.is_deleted = 0
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
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available' AND p.is_deleted = 0
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
    const [rows] = await db.query(query, [
      searchPattern,
      parseInt(limit),
      parseInt(offset),
    ]);
    return rows;
  }

  /**
   * Count search results
   */
  async countSearch(keyword) {
    const query = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE name LIKE ? AND is_deleted = 0
    `;

    const searchPattern = `%${keyword}%`;
    const [rows] = await db.query(query, [searchPattern]);
    return rows[0].total;
  }
}

module.exports = new CategoryRepository();
