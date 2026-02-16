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
    LIMIT ${parseInt(limit)}
  `;

    const [rows] = await pool.query(sql);
    return rows;
  }
}

module.exports = new NewsRepository();
