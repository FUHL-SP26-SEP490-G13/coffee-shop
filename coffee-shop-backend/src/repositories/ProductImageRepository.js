const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class ProductImageRepository extends BaseRepository {
  constructor() {
    super('product_images');
  }

  /**
   * Find images by product ID
   */
  async findByProductId(productId) {
    return this.findAll({ product_id: productId, is_deleted: 0 });
  }

  /**
   * Delete all images by product ID (soft delete)
   */
  async deleteByProductId(productId) {
    const query = `UPDATE ${this.tableName} SET is_deleted = 1 WHERE product_id = ?`;
    const [result] = await db.query(query, [productId]);
    return result.affectedRows > 0;
  }

  /**
   * Set thumbnail for product
   */
  async setThumbnail(productId, imageId) {
    // Remove all thumbnails for this product
    await db.query(
      `UPDATE ${this.tableName} SET isThumbnail = 0 WHERE product_id = ?`,
      [productId]
    );

    // Set new thumbnail
    await db.query(
      `UPDATE ${this.tableName} SET isThumbnail = 1 WHERE id = ?`,
      [imageId]
    );
  }
}

module.exports = new ProductImageRepository();