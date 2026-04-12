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
    if (options.with_count) {
      const query = `
        SELECT c.*, 
          (SELECT COUNT(*) 
           FROM products p 
           WHERE p.category_id = c.id AND p.is_deleted = 0 AND p.status = 'available'
          ) as product_count
        FROM category c 
        WHERE c.is_deleted = 0
        ORDER BY c.name ASC
      `;
      const [rows] = await db.query(query);
      return rows;
    }

    return this.findAll(
      { is_deleted: 0 },
      { orderBy: 'name', order: 'ASC' },
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

  async findBySlug(slug) {
    return this.findOne({ slug, is_deleted: 0 });
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
}

module.exports = new CategoryRepository();
