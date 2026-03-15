const BaseRepository = require("./BaseRepository");

class FavoriteRepository extends BaseRepository {
  constructor() {
    super("favorites");
  }

  async findByUserAndProduct(userId, productId) {
    const query = `
      SELECT * 
      FROM favorites
      WHERE user_id = ? AND product_id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.query(query, [userId, productId]);
    return rows[0] || null;
  }

  async getFavoritesByUser(userId, { keyword = "", page = 1, limit = 4 }) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 4);
    const offset = (currentPage - 1) * pageSize;
    const searchKeyword = `%${keyword}%`;

    const countQuery = `
    SELECT COUNT(*) AS total
    FROM favorites f
    INNER JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    AND p.name LIKE ?
    AND p.is_deleted = 0
    `;

    const dataQuery = `
    SELECT
    f.id,
    f.user_id,
    f.product_id,
    f.created_at,
    p.name,
    p.description,
    p.category_id,
    p.status,
    COALESCE(pi_thumb.image_url, pi_first.image_url) AS image_url
    FROM favorites f
    INNER JOIN products p ON p.id = f.product_id
    LEFT JOIN product_images pi_thumb
    ON pi_thumb.product_id = p.id
    AND pi_thumb.isThumbnail = 1
    AND pi_thumb.is_deleted = 0
    LEFT JOIN product_images pi_first
    ON pi_first.id = (
      SELECT pi2.id
      FROM product_images pi2
      WHERE pi2.product_id = p.id
        AND pi2.is_deleted = 0
      ORDER BY pi2.isThumbnail DESC, pi2.id ASC
      LIMIT 1
    )
    WHERE f.user_id = ?
    AND p.name LIKE ?
    AND p.is_deleted = 0
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
    `;

    const [countRows] = await this.db.query(countQuery, [
      userId,
      searchKeyword,
    ]);

    const total = countRows[0]?.total || 0;

    const [rows] = await this.db.query(dataQuery, [
      userId,
      searchKeyword,
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

  async createFavorite(userId, productId) {
    const query = `
      INSERT INTO favorites (user_id, product_id)
      VALUES (?, ?)
    `;
    const [result] = await this.db.query(query, [userId, productId]);
    return result;
  }

  async deleteFavorite(userId, productId) {
    const query = `
      DELETE FROM favorites
      WHERE user_id = ? AND product_id = ?
    `;
    const [result] = await this.db.query(query, [userId, productId]);
    return result;
  }
}

module.exports = new FavoriteRepository();
