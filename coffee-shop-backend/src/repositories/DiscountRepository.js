const pool = require("../config/database");

class DiscountRepository {
  async findAll({ page = 1, limit = 10, code = "", status = "" }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (code) {
      conditions.push("code LIKE ?");
      params.push(`%${code}%`);
    }

    if (status === "active") {
      // active: còn hạn + đang bật
      conditions.push("(valid_until IS NULL OR valid_until >= NOW())");
      conditions.push("is_active = 1");
    }

    if (status === "expired") {
      // expired: valid_until có và đã qua
      conditions.push("valid_until IS NOT NULL AND valid_until < NOW()");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT *
      FROM discount
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?, ?
    `;

    const [rows] = await pool.query(sql, [...params, offset, limit]);

    const countSql = `
      SELECT COUNT(*) as total
      FROM discount
      ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, params);

    const total = countRows[0].total;

    return {
      items: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM discount WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  async create(data) {
    const sql = `
      INSERT INTO discount
      (code, description, percentage, min_order_amount,
       max_discount_amount, usage_limit, valid_from, valid_until, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      data.code,
      data.description ?? null,
      data.percentage,
      data.min_order_amount ?? 0,
      data.max_discount_amount ?? null,
      data.usage_limit ?? null,
      data.valid_from ?? null,
      data.valid_until ?? null,
      data.is_active ?? 1,
    ]);

    return result.insertId;
  }

  async update(id, data) {
    const sql = `
      UPDATE discount SET
      code = ?,
      description = ?,
      percentage = ?,
      min_order_amount = ?,
      max_discount_amount = ?,
      usage_limit = ?,
      valid_from = ?,
      valid_until = ?,
      is_active = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [
      data.code,
      data.description ?? null,
      data.percentage,
      data.min_order_amount ?? 0,
      data.max_discount_amount ?? null,
      data.usage_limit ?? null,
      data.valid_from ?? null,
      data.valid_until ?? null,
      data.is_active ?? 1,
      id,
    ]);

    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM discount WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }
}

module.exports = new DiscountRepository();
