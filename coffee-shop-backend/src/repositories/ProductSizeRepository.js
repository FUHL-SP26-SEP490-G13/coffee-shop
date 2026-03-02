const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class ProductSizeRepository extends BaseRepository {
  constructor() {
    super('product_sizes');
  }

  /**
   * Delete all sizes by product ID (soft delete)
   */
  async deleteByProductId(productId) {
    const query = `UPDATE ${this.tableName} SET is_deleted = 1 WHERE product_id = ?`;
    const [result] = await db.query(query, [productId]);
    return result.affectedRows > 0;
  }

  /**
   * Find sizes by product ID
   */
  async findByProductId(productId) {
    return this.findAll({ product_id: productId, is_deleted: 0 });
  }

  async findByProductAndSize(productId, size) {
    const [rows] = await db.query(
      `
    SELECT * FROM product_sizes
    WHERE product_id = ? 
    AND size = ?
    `,
      [productId, size],
    );

    return rows[0];
  }

  /**
   * Insert or update size (UPSERT)
   */
  async upsert(productId, size, price) {
    const [result] = await db.query(
      `
    INSERT INTO product_sizes (product_id, size, price)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      price = VALUES(price),
      is_deleted = 0
    `,
      [productId, size, price],
    );

    return result;
  }

  /**
   * Soft delete sizes not in incoming list
   */
  async softDeleteNotIn(productId, sizes) {
    if (!sizes || sizes.length === 0) {
      return this.deleteByProductId(productId);
    }

    const [result] = await db.query(
      `
    UPDATE product_sizes
    SET is_deleted = 1
    WHERE product_id = ?
    AND size NOT IN (?)
    `,
      [productId, sizes],
    );

    return result;
  }
}

module.exports = new ProductSizeRepository();
