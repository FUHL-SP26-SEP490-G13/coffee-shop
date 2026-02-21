const pool = require("../config/database");

class BannerRepository {
  async findActive() {
    const sql = "SELECT * FROM banners WHERE is_active = 1 LIMIT 1";
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  async findAll({ page = 1, limit = 5, keyword = "" }) {
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params = [];

    if (keyword) {
      whereClause = "WHERE title LIKE ?";
      params.push(`%${keyword}%`);
    }

    const sql = `
    SELECT * FROM banners
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?, ?
  `;

    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);

    const countSql = `
    SELECT COUNT(*) as total
    FROM banners
    ${whereClause}
  `;

    const [countRows] = await pool.query(
      countSql,
      keyword ? [`%${keyword}%`] : []
    );

    return {
      data: rows,
      total: countRows[0].total,
    };
  }

  async create(data) {
    const sql = `
      INSERT INTO banners (title, subtitle, image_url, button_text, button_link, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [
      data.title,
      data.subtitle,
      data.image_url,
      data.button_text,
      data.button_link,
      data.is_active ?? false,
    ]);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    values.push(id);

    const sql = `
    UPDATE banners
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

    await pool.query(sql, values);
  }

  async deactivateAll() {
    await pool.query("UPDATE banners SET is_active = 0");
  }

  async delete(id) {
    await pool.query("DELETE FROM banners WHERE id = ?", [id]);
  }

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM banners WHERE id = ?", [id]);
    return rows[0];
  }
}

module.exports = new BannerRepository();
