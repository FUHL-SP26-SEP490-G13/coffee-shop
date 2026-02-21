const pool = require("../config/database");

class NewsletterRepository {
  async create(email) {
    const sql = "INSERT INTO newsletter_subscribers (email) VALUES (?)";
    await pool.query(sql, [email]);
  }

  async findByEmail(email) {
    const sql = "SELECT * FROM newsletter_subscribers WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);
    return rows[0];
  }

  async findAll() {
    const sql = "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC";
    const [rows] = await pool.query(sql);
    return rows;
  }

  async delete(id) {
    const sql = "DELETE FROM newsletter_subscribers WHERE id = ?";
    await pool.query(sql, [id]);
  }
}

module.exports = new NewsletterRepository();
