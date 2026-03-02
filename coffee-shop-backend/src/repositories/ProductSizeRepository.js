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
}

module.exports = new ProductSizeRepository();