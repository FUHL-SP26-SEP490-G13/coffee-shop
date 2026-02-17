const pool = require("../config/database");
const BaseRepository = require("./BaseRepository");

class NewsRepository extends BaseRepository {
  constructor() {
    super("news");
  }

  async findPublished() {
    return this.findAll({ is_published: 1 }, { orderBy: "created_at" });
  }

  async findBySlug(slug) {
    return this.findOne({ slug, is_published: 1 });
  }

  async findFeatured(limit = 3) {
    const sql = `
      SELECT * FROM news
      WHERE is_published = 1
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [limit]);
    return rows;
  }

  async findPublishedPaginated(limit, offset) {
    const sql = `
      SELECT * FROM news
      WHERE is_published = 1
      ORDER BY created_at DESC
      LIMIT ?, ?
    `;
    const [rows] = await pool.query(sql, [offset, limit]);
    return rows;
  }

  async findAllAdmin() {
    const sql = `
      SELECT * FROM news
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async deleteById(id) {
    return this.delete({ id });
  }

  async updateById(id, data) {
    return this.update({ id }, data);
  }
}

module.exports = new NewsRepository();
