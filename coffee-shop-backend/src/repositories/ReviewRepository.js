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
        r.images,
        r.created_at,
        r.updated_at,
        r.reply_comment,
        r.reply_images,
        r.replied_at,
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

  async findById(id) {
    const query = `
      SELECT *
      FROM reviews
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.query(query, [id]);
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

  async createReview(userId, productId, rating, comment, images = []) {
    const query = `
      INSERT INTO reviews (user_id, product_id, rating, comment, images)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await this.db.query(query, [
      userId,
      productId,
      rating,
      comment || null,
      JSON.stringify(images),
    ]);
    return result;
  }

  async updateReview(userId, productId, rating, comment, images = []) {
    const query = `
      UPDATE reviews
      SET rating = ?, comment = ?, images = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND product_id = ?
    `;
    const [result] = await this.db.query(query, [
      rating,
      comment || null,
      JSON.stringify(images),
      userId,
      productId,
    ]);
    return result;
  }

  async replyReview(id, replyComment, replyImages = []) {
    const query = `
      UPDATE reviews
      SET reply_comment = ?, reply_images = ?, replied_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [result] = await this.db.query(query, [
      replyComment || null,
      JSON.stringify(replyImages),
      id,
    ]);
    return result;
  }

  async getAllReviews({ keyword = "", page = 1, limit = 7 }) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 7);
    const offset = (currentPage - 1) * pageSize;
    const searchKeyword = `%${keyword}%`;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    INNER JOIN products p ON p.id = r.product_id
    WHERE 
      p.name LIKE ?
      OR CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ?
      OR r.comment LIKE ?
      OR CAST(r.rating AS CHAR) LIKE ?
  `;

    const dataQuery = `
    SELECT
      r.id,
      r.user_id,
      r.product_id,
      r.rating,
      r.comment,
      r.images,
      r.created_at,
      r.updated_at,
      r.reply_comment,
      r.reply_images,
      r.replied_at,
      u.first_name,
      u.last_name,
      p.name AS product_name,
      c.name AS category_name
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    INNER JOIN products p ON p.id = r.product_id
    LEFT JOIN category c ON p.category_id = c.id
    WHERE 
      p.name LIKE ?
      OR CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ?
      OR r.comment LIKE ?
      OR CAST(r.rating AS CHAR) LIKE ?
    ORDER BY r.updated_at DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const params = [searchKeyword, searchKeyword, searchKeyword, searchKeyword];

    const [countRows] = await this.db.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    const [rows] = await this.db.query(dataQuery, [
      ...params,
      pageSize,
      offset,
    ]);

    return {
      items: rows,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
  async getPublicReviews(limit = 9) {
    const query = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.images,
        r.created_at,
        r.reply_comment,
        r.reply_images,
        r.replied_at,
        u.first_name,
        u.last_name
      FROM reviews r
      INNER JOIN users u ON u.id = r.user_id
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT ?
    `;

    const [rows] = await this.db.query(query, [limit]);
    return rows;
  }
}

module.exports = new ReviewRepository();
