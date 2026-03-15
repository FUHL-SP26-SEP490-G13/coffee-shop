const BaseRepository = require("./BaseRepository");

class ReviewRepository extends BaseRepository {
  constructor() {
    super("reviews");
  }

  async getByProductId(productId) {
    const query = `
      SELECT
        r.id,
        r.user_id,
        r.product_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        u.first_name,
        u.last_name
      FROM reviews r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.updated_at DESC, r.created_at DESC
    `;
    const [rows] = await this.db.query(query, [productId]);
    return rows;
  }

  async findByUserAndProduct(userId, productId) {
    const query = `
      SELECT *
      FROM reviews
      WHERE user_id = ? AND product_id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.query(query, [userId, productId]);
    return rows[0] || null;
  }

  async hasPurchasedProduct(userId, productId) {
    const query = `
      SELECT od.id
      FROM orders o
      INNER JOIN order_details od ON od.order_id = o.id
      INNER JOIN product_sizes ps ON ps.id = od.product_size_id
      WHERE o.user_id = ?
        AND ps.product_id = ?
        AND o.status = 'completed'
        AND o.is_paid = 1
      LIMIT 1
    `;
    const [rows] = await this.db.query(query, [userId, productId]);
    return rows.length > 0;
  }

  async createReview(userId, productId, rating, comment) {
    const query = `
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await this.db.query(query, [
      userId,
      productId,
      rating,
      comment || null,
    ]);
    return result;
  }

  async updateReview(userId, productId, rating, comment) {
    const query = `
      UPDATE reviews
      SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND product_id = ?
    `;
    const [result] = await this.db.query(query, [
      rating,
      comment || null,
      userId,
      productId,
    ]);
    return result;
  }
}

module.exports = new ReviewRepository();
