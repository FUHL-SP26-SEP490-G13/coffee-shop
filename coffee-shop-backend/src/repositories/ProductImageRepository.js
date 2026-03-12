const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class ProductImageRepository extends BaseRepository {
  constructor() {
    super('product_images');
  }

  /**
   * Find images by product ID (chỉ lấy ảnh chưa xóa)
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
   * Soft delete image by its own id (wrapper for readability)
   */
  async softDeleteById(id) {
    return this.softDelete(id);
  }

  /**
   * Set thumbnail for product
   * Bỏ tất cả thumbnail cũ, set thumbnail mới
   */
  async setThumbnail(productId, imageId) {
    // Remove all thumbnails for this product
    await db.query(
      `UPDATE ${this.tableName} SET isThumbnail = 0 WHERE product_id = ? AND is_deleted = 0`,
      [productId]
    );

    // Set new thumbnail
    await db.query(
      `UPDATE ${this.tableName} SET isThumbnail = 1 WHERE id = ? AND is_deleted = 0`,
      [imageId]
    );
  }

  /**
   * Check if product has thumbnail
   */
  async hasThumbnail(productId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE product_id = ? AND isThumbnail = 1 AND is_deleted = 0`,
      [productId]
    );
    return rows[0].count > 0;
  }

  /**
   * Get thumbnail image of product
   */
  async getThumbnail(productId) {
    const [rows] = await db.query(
      `SELECT * FROM ${this.tableName} 
       WHERE product_id = ? AND isThumbnail = 1 AND is_deleted = 0 
       LIMIT 1`,
      [productId]
    );
    return rows[0] || null;
  }
}

module.exports = new ProductImageRepository();