const db = require('../config/database');

class OAuthProviderRepository {
  constructor() {
    this.tableName = 'user_oauth_providers';
  }

  async findByProvider(provider, providerId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE provider = ? AND provider_id = ?
    `;
    const [rows] = await db.query(query, [provider, providerId]);
    return rows[0] || null;
  }

  async create(data) {
    const query = `
      INSERT INTO ${this.tableName}
      (user_id, provider, provider_id, access_token, refresh_token, linked_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(query, [
      data.user_id,
      data.provider,
      data.provider_id,
      data.access_token || null,
      data.refresh_token || null,
    ]);

    return result.insertId;
  }

  async findByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }
}

module.exports = new OAuthProviderRepository();