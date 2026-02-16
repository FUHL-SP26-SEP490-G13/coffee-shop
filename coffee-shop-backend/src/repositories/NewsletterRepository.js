const pool = require("../config/database");

class NewsletterRepository {
  async create(email) {
    const [result] = await pool.execute(
      `
      INSERT INTO newsletter_subscribers (email)
      VALUES (?)
      `,
      [email]
    );
    return result;
  }
}

module.exports = new NewsletterRepository();
