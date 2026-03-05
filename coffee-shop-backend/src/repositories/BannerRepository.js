const pool = require("../config/database");

class BannerRepository {
  async findActive() {
    const sql = "SELECT * FROM banners WHERE is_active = 1 LIMIT 1";
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  async findAll({ page = 1, limit = 5, keyword = "", status = "" }) {
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (keyword) {
      where.push("(title LIKE ? OR subtitle LIKE ?)");
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status !== "") {
      where.push("is_active = ?");
      params.push(status === "active" ? 1 : 0);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

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

    const countParams = params.slice(0, params.length - 2);

    const [countRows] = await pool.query(countSql, countParams);

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

  // For admin dashboard - get all banners regardless of active status
  async findActiveList() {
    const sql =
      "SELECT * FROM banners WHERE is_active = 1 ORDER BY created_at DESC";
    const [rows] = await pool.query(sql);
    return rows;
  }
}

module.exports = new BannerRepository();
