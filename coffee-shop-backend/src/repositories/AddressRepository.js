const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class AddressRepository extends BaseRepository {
  constructor() {
    super('addresses');
  }

  async findByUserId(userId) {
    const query = `
      SELECT
        a.*, 
        NULL AS province_name,
        NULL AS ward_name
      FROM ${this.tableName} a
      WHERE a.user_id = ? AND a.is_deleted = 0
      ORDER BY a.is_default DESC, a.id DESC
    `;

    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  async findByIdAndUser(addressId, userId) {
    const query = `
      SELECT
        a.*, 
        NULL AS province_name,
        NULL AS ward_name
      FROM ${this.tableName} a
      WHERE a.id = ? AND a.user_id = ? AND a.is_deleted = 0
      LIMIT 1
    `;

    const [rows] = await db.query(query, [addressId, userId]);
    return rows[0] || null;
  }

  async clearDefaultByUserId(userId) {
    const query = `
      UPDATE ${this.tableName}
      SET is_default = 0
      WHERE user_id = ? AND is_deleted = 0
    `;

    await db.query(query, [userId]);
  }

  async softDeleteByIdAndUser(addressId, userId) {
    const query = `
      UPDATE ${this.tableName}
      SET is_deleted = 1, is_default = 0
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;

    const [result] = await db.query(query, [addressId, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = new AddressRepository();
