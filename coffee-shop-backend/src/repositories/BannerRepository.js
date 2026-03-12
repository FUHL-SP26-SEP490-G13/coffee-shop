const pool = require("../config/database");

class BannerRepository {
  async findActive() {
    const sql = `
      SELECT *
      FROM banners
      WHERE NOW() >= start_date
        AND NOW() <= end_date
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  async findAll({ page = 1, limit = 5, keyword = "", status = "" }) {
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (keyword) {
      where.push("title LIKE ?");
      params.push(`%${keyword}%`);
    }

    if (status === "active") {
      where.push("NOW() >= start_date AND NOW() <= end_date");
    } else if (status === "upcoming") {
      where.push("NOW() < start_date");
    } else if (status === "expired") {
      where.push("NOW() > end_date");
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const sql = `
    SELECT *
    FROM banners
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?, ?
  `;

    const queryParams = [...params, offset, limit];
    const [rows] = await pool.query(sql, queryParams);

    const countSql = `
    SELECT COUNT(*) as total
    FROM banners
    ${whereClause}
  `;
    const [countRows] = await pool.query(countSql, params);

    return {
      data: rows,
      total: countRows[0].total,
    };
  }

  async create(data) {
    const sql = `
      INSERT INTO banners
      (title, subtitle, image_url, button_text, button_link, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      data.title,
      data.subtitle,
      data.image_url,
      data.button_text,
      data.button_link,
      data.start_date,
      data.end_date,
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

    if (fields.length === 0) {
      throw new Error("Không có dữ liệu để cập nhật");
    }

    values.push(id);

    const sql = `
      UPDATE banners
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      throw new Error("Không tìm thấy quảng cáo");
    }

    return true;
  }

  async delete(id) {
    await pool.query("DELETE FROM banners WHERE id = ?", [id]);
  }

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM banners WHERE id = ?", [id]);
    return rows[0];
  }

  async findActiveList() {
    const sql = `
      SELECT *
      FROM banners
      WHERE NOW() >= start_date
        AND NOW() <= end_date
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async findByTitle(title) {
    const [rows] = await pool.query(
      "SELECT * FROM banners WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) LIMIT 1",
      [title]
    );
    return rows[0];
  }

  async findByTitleExcludeId(title, id) {
    const [rows] = await pool.query(
      "SELECT * FROM banners WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND id != ? LIMIT 1",
      [title, id]
    );
    return rows[0];
  }
}

module.exports = new BannerRepository();
