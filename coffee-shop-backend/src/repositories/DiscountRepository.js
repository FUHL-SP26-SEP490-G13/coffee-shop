const pool = require("../config/database");

class DiscountRepository {
  async findAll({ page = 1, limit = 10, code = "", status = "" }) {
    const offset = (page - 1) * limit;

    const conditions = ["is_delete = 0"];
    const params = [];

    if (code) {
      const cleanValue = code.replace("%", "").trim();

      conditions.push(`
      (
        code LIKE ?
        OR description LIKE ?
        OR CAST(percentage AS CHAR) LIKE ?
      )
    `);

      params.push(`%${cleanValue}%`, `%${cleanValue}%`, `%${cleanValue}%`);
    }

    if (status === "active") {
      conditions.push("(valid_until IS NULL OR valid_until >= NOW())");
      conditions.push("is_active = 1");
    }

    if (status === "expired") {
      conditions.push("valid_until IS NOT NULL AND valid_until < NOW()");
    }

    if (status === "enabled") {
      conditions.push("is_active = 1");
    }

    if (status === "disabled") {
      conditions.push("is_active = 0");
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

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
    const [rows] = await pool.query(
      "SELECT * FROM discount WHERE id = ? AND is_delete = 0",
      [id]
    );
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
    const fields = [];
    const values = [];

    if (data.code !== undefined) {
      fields.push("code = ?");
      values.push(data.code);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description ?? null);
    }

    if (data.percentage !== undefined) {
      fields.push("percentage = ?");
      values.push(data.percentage);
    }

    if (data.min_order_amount !== undefined) {
      fields.push("min_order_amount = ?");
      values.push(data.min_order_amount ?? 0);
    }

    if (data.max_discount_amount !== undefined) {
      fields.push("max_discount_amount = ?");
      values.push(data.max_discount_amount ?? null);
    }

    if (data.usage_limit !== undefined) {
      fields.push("usage_limit = ?");
      values.push(data.usage_limit ?? null);
    }

    if (data.valid_from !== undefined) {
      fields.push("valid_from = ?");
      values.push(data.valid_from ?? null);
    }

    if (data.valid_until !== undefined) {
      fields.push("valid_until = ?");
      values.push(data.valid_until ?? null);
    }

    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      throw new Error("Không có dữ liệu để cập nhật");
    }

    const sql = `
    UPDATE discount
    SET ${fields.join(", ")}
    WHERE id = ? AND is_delete = 0
  `;

    values.push(id);

    const [result] = await pool.query(sql, values);

    return result.affectedRows > 0;
  }

  async deleteHard(id) {
    const [result] = await pool.query(
      "DELETE FROM discount WHERE id = ? AND is_delete = 0",
      [id]
    );
    return result.affectedRows > 0;
  }

  async findByCode(code) {
    const [rows] = await pool.query(
      "SELECT id FROM discount WHERE LOWER(code) = LOWER(?) AND is_delete = 0 LIMIT 1",
      [code]
    );
    return rows[0];
  }

  async softDelete(id, newCode) {
    const sql = `
    UPDATE discount
    SET code = ?, is_delete = 1, is_active = 0
    WHERE id = ? AND is_delete = 0
  `;

    const [result] = await pool.query(sql, [newCode, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DiscountRepository();
