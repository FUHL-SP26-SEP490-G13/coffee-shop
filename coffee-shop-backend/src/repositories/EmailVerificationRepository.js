const db = require("../config/database");

class EmailVerificationRepository {
  async create(data) {
    const query = `
      INSERT INTO email_verifications 
      (user_id, otp_hash, expires_at, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const [result] = await db.query(query, [
      data.user_id,
      data.otp_hash,
      data.expires_at,
    ]);

    return { id: result.insertId, ...data };
  }

  async findLatestValidByUser(userId) {
    const query = `
      SELECT * FROM email_verifications
      WHERE user_id = ?
      AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [rows] = await db.query(query, [userId]);
    return rows[0] || null;
  }

  async markUsed(id) {
    await db.query(
      `UPDATE email_verifications SET is_used = 1 WHERE id = ?`,
      [id]
    );
  }

  async incrementFailed(id) {
    await db.query(
      `UPDATE email_verifications 
       SET failed_attempts = failed_attempts + 1 
       WHERE id = ?`,
      [id]
    );
  }
}

module.exports = new EmailVerificationRepository();