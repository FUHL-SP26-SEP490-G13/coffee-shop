const pool = require("../config/database");

class VoucherRepository {
  async findAll({ page = 1, limit = 10, code = "", status = "", type = "" }) {
    const offset = (page - 1) * limit;

    let conditions = [];
    const params = [];

    if (code) {
      conditions.push("code LIKE ?");
      params.push(`%${code}%`);
    }

    if (code) {
      const keywords = code.trim().split(/\s+/);

      keywords.forEach((word) => {
        conditions.push("code LIKE ?");
        params.push(`%${word}%`);
      });
    }


    if (status === "active") {
      conditions.push("end_date >= NOW()");
    }

    if (status === "expired") {
      conditions.push("end_date < NOW()");
    }

    if (type === "percent") {
      conditions.push("discount_type = ?");
      params.push("percent");
    }

    if (type === "fixed") {
      conditions.push("discount_type = ?");
      params.push("fixed");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
    SELECT *
    FROM vouchers
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?, ?
  `;

    const queryParams = [...params, offset, limit];

    const [rows] = await pool.query(sql, queryParams);

    const countSql = `
    SELECT COUNT(*) as total
    FROM vouchers
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
    const [rows] = await pool.query("SELECT * FROM vouchers WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  async create(data) {
    const sql = `
      INSERT INTO vouchers 
      (code, discount_type, discount_value, min_order_value, 
       max_discount, usage_limit, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      data.code,
      data.discount_type,
      data.discount_value,
      data.min_order_value,
      data.max_discount,
      data.usage_limit,
      data.start_date,
      data.end_date,
      data.is_active,
    ]);

    return result.insertId;
  }

  async update(id, data) {
    const sql = `
      UPDATE vouchers SET
      code = ?,
      discount_type = ?,
      discount_value = ?,
      min_order_value = ?,
      max_discount = ?,
      usage_limit = ?,
      start_date = ?,
      end_date = ?,
      is_active = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [
      data.code,
      data.discount_type,
      data.discount_value,
      data.min_order_value,
      data.max_discount,
      data.usage_limit,
      data.start_date,
      data.end_date,
      data.is_active,
      id,
    ]);

    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM vouchers WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }
}

module.exports = new VoucherRepository();
