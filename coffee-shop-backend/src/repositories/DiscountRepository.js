const pool = require('../config/database');

class DiscountRepository {
  async findAll({ page = 1, limit = 7, code = '', status = '' }) {
    const offset = (page - 1) * limit;

    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (code) {
      const cleanValue = code.trim();

      conditions.push(`
        (
          code LIKE ?
          OR description LIKE ?
          OR CAST(percentage AS CHAR) LIKE ?
        )
      `);

      params.push(`%${cleanValue}%`, `%${cleanValue}%`, `%${cleanValue}%`);
    }

    if (status === 'active') {
      conditions.push('valid_from <= NOW()');
      conditions.push('(valid_until IS NULL OR valid_until > NOW())');
    }

    if (status === 'expired') {
      conditions.push('valid_until IS NOT NULL AND valid_until <= NOW()');
    }

    if (status === 'upcoming') {
      conditions.push('valid_from > NOW()');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

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

  async findPublic() {
    const sql = `
      SELECT *
      FROM discount
      WHERE deleted_at IS NULL
        AND valid_from <= NOW()
        AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY percentage DESC, created_at DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM discount WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return rows[0];
  }

  async findByCode(code) {
    const [rows] = await pool.query(
      'SELECT id FROM discount WHERE LOWER(code) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
      [code],
    );
    return rows[0];
  }

  async findByCodeFull(code) {
    const [rows] = await pool.query(
      `
    SELECT *
    FROM discount
    WHERE LOWER(code) = LOWER(?)
      AND deleted_at IS NULL
    LIMIT 1
    `,
      [code.trim()],
    );

    return rows[0];
  }

  async create(data) {
    const sql = `
      INSERT INTO discount
      (
        code,
        description,
        percentage,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        valid_from,
        valid_until
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      data.code,
      data.description ?? null,
      data.percentage,
      data.min_order_amount ?? 0,
      data.max_discount_amount ?? null,
      data.usage_limit ?? null,
      data.valid_from,
      data.valid_until ?? null,
    ]);

    return result.insertId;
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.code !== undefined) {
      fields.push('code = ?');
      values.push(data.code);
    }

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description ?? null);
    }

    if (data.percentage !== undefined) {
      fields.push('percentage = ?');
      values.push(data.percentage);
    }

    if (data.min_order_amount !== undefined) {
      fields.push('min_order_amount = ?');
      values.push(data.min_order_amount);
    }

    if (data.max_discount_amount !== undefined) {
      fields.push('max_discount_amount = ?');
      values.push(data.max_discount_amount ?? null);
    }

    if (data.usage_limit !== undefined) {
      fields.push('usage_limit = ?');
      values.push(data.usage_limit ?? null);
    }

    if (data.valid_from !== undefined) {
      fields.push('valid_from = ?');
      values.push(data.valid_from);
    }

    if (data.valid_until !== undefined) {
      fields.push('valid_until = ?');
      values.push(data.valid_until ?? null);
    }

    if (fields.length === 0) {
      throw new Error('Không có dữ liệu để cập nhật');
    }

    const sql = `
      UPDATE discount
      SET ${fields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    values.push(id);

    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  }

  async softDelete(id, newCode) {
    const sql = `
      UPDATE discount
      SET code = ?, deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const [result] = await pool.query(sql, [newCode, id]);
    return result.affectedRows > 0;
  }

  async hardDelete(id) {
    const sql = `
      DELETE FROM discount
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DiscountRepository();
