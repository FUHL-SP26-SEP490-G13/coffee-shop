const pool = require("../config/database");
const BaseRepository = require("./BaseRepository");

class NewsRepository extends BaseRepository {
  constructor() {
    super("news");
  }

  async findBySlug(slug) {
    return this.findOne({ slug });
  }

  async findFeatured(limit = 3) {
    const sql = `
      SELECT * FROM news
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [limit]);
    return rows;
  }

  async findPublishedPaginated(limit, offset) {
    const sql = `
      SELECT * FROM news
      ORDER BY created_at DESC
      LIMIT ?, ?
    `;
    const [rows] = await pool.query(sql, [offset, limit]);
    return rows;
  }

  async findAllAdminPaginated(limit, offset, title = "") {
    let sql = `SELECT * FROM news WHERE 1=1`;
    const values = [];

    // CHỈ filter khi title có giá trị thật sự
    if (title && title.trim() !== "") {
      sql += " AND title LIKE ?";
      values.push(`%${title.trim()}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT ?, ?";
    values.push(offset, limit);

    const [rows] = await pool.query(sql, values);
    return rows;
  }

  async countAll(title = "") {
    let sql = `SELECT COUNT(*) as total FROM news WHERE 1=1`;
    const values = [];

    if (title && title.trim() !== "") {
      sql += " AND title LIKE ?";
      values.push(`%${title.trim()}%`);
    }

    const [rows] = await pool.query(sql, values);
    return rows[0].total;
  }

  async deleteById(id) {
    const sql = `DELETE FROM news WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result;
  }

  async updateById(id, data) {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      values.push(data.title);
    }

    if (data.summary !== undefined) {
      fields.push("summary = ?");
      values.push(data.summary);
    }

    if (data.content !== undefined) {
      fields.push("content = ?");
      values.push(data.content);
    }

    if (data.thumbnail !== undefined) {
      fields.push("thumbnail = ?");
      values.push(data.thumbnail);
    }

    if (fields.length === 0) {
      throw new Error("Không có dữ liệu để cập nhật");
    }

    const sql = `
    UPDATE news
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

    values.push(id);

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy bài viết");
    }

    return true;
  }
}

module.exports = new NewsRepository();
