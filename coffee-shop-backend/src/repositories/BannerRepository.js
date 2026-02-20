const pool = require("../config/database");

class BannerRepository {
  async findActive() {
    const sql = "SELECT * FROM banners WHERE is_active = 1 LIMIT 1";
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  async findAll() {
    const sql = "SELECT * FROM banners ORDER BY created_at DESC";
    const [rows] = await pool.query(sql);
    return rows;
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
    const sql = `
      UPDATE banners 
      SET title=?, subtitle=?, image_url=?, button_text=?, button_link=?, is_active=?
      WHERE id=?
    `;
    await pool.query(sql, [
      data.title,
      data.subtitle,
      data.image_url,
      data.button_text,
      data.button_link,
      data.is_active,
      id,
    ]);
  }

  async deactivateAll() {
    await pool.query("UPDATE banners SET is_active = 0");
  }
}

module.exports = new BannerRepository();
