const db = require("../config/database");

class ProvinceRepository {
  async findAll() {
    const [rows] = await db.query(
      `
      SELECT id, name
      FROM provinces
      ORDER BY name ASC
      `
    );

    return rows;
  }

  async findById(id, connection = null) {
    const executor = connection || db;
    const [rows] = await executor.query(
      `
      SELECT id, name
      FROM provinces
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;
  }

  async create(name) {
    const [result] = await db.query(
      `
      INSERT INTO provinces (name)
      VALUES (?)
      `,
      [name]
    );

    return this.findById(result.insertId);
  }
}

module.exports = new ProvinceRepository();
