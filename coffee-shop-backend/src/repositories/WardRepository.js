const db = require("../config/database");

class WardRepository {
  async findByProvinceId(provinceId, { activeOnly = true } = {}) {
    const whereActive = activeOnly ? " AND w.is_active = 1" : "";

    const [rows] = await db.query(
      `
      SELECT
        w.id,
        w.name,
        w.province_id,
        w.is_active,
        p.name AS province_name
      FROM wards w
      JOIN provinces p ON p.id = w.province_id
      WHERE w.province_id = ?${whereActive}
      ORDER BY w.name ASC
      `,
      [provinceId]
    );

    return rows;
  }

  async findById(id, connection = null) {
    const executor = connection || db;
    const [rows] = await executor.query(
      `
      SELECT
        w.id,
        w.name,
        w.province_id,
        w.is_active,
        p.name AS province_name
      FROM wards w
      JOIN provinces p ON p.id = w.province_id
      WHERE w.id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;
  }

  async findActiveByIdAndProvince(wardId, provinceId, connection = null) {
    const executor = connection || db;
    const [rows] = await executor.query(
      `
      SELECT
        w.id,
        w.name,
        w.province_id,
        w.is_active,
        p.name AS province_name
      FROM wards w
      JOIN provinces p ON p.id = w.province_id
      WHERE w.id = ?
        AND w.province_id = ?
        AND w.is_active = 1
      LIMIT 1
      `,
      [wardId, provinceId]
    );

    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query(
      `
      INSERT INTO wards (
        name,
        province_id,
        is_active
      )
      VALUES (?, ?, ?)
      `,
      [
        data.name,
        data.province_id,
        data.is_active,
      ]
    );

    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }

    if (data.province_id !== undefined) {
      fields.push("province_id = ?");
      values.push(data.province_id);
    }

    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await db.query(
      `
      UPDATE wards
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values
    );

    return this.findById(id);
  }
}

module.exports = new WardRepository();
