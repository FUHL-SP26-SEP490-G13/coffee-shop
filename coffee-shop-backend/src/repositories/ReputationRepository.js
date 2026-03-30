const db = require("../config/database");

const buildNormalizedPhoneExpr = (fieldExpr) => {
  const phoneDigitsExpr = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(${fieldExpr}, '')), ' ', ''), '.', ''), '-', ''), '(', ''), ')', ''), '+', '')`;

  return `
    CASE
      WHEN LEFT(${phoneDigitsExpr}, 2) = '84' AND CHAR_LENGTH(${phoneDigitsExpr}) >= 11
        THEN CONCAT('0', SUBSTRING(${phoneDigitsExpr}, 3))
      WHEN CHAR_LENGTH(${phoneDigitsExpr}) = 9
        THEN CONCAT('0', ${phoneDigitsExpr})
      ELSE ${phoneDigitsExpr}
    END
  `;
};

class ReputationRepository {
  async createReputationProfileIfNotExists(connection, phoneNumber) {
    await connection.query(
      `
      INSERT INTO reputation_profiles (phone_number)
      VALUES (?)
      ON DUPLICATE KEY UPDATE phone_number = phone_number
      `,
      [phoneNumber]
    );
  }

  async findReputationProfileByPhone(phoneNumber) {
    const [rows] = await db.query(
      `
      SELECT
        phone_number,
        current_score,
        total_orders_completed,
        total_orders_cancelled,
        is_frozen,
        updated_at
      FROM reputation_profiles
      WHERE phone_number = ?
      LIMIT 1
      `,
      [phoneNumber]
    );

    return rows[0] || null;
  }

  async findReputationProfiles({ keyword = "", limit = 20, offset = 0 } = {}) {
    const normalizedPhoneExpr = buildNormalizedPhoneExpr("odi.receiver_phone");

    const params = [];
    let whereClause = "";
    if (keyword) {
      whereClause = "WHERE rp.phone_number LIKE ?";
      params.push(`%${keyword}%`);
    }

    const [rows] = await db.query(
      `
      SELECT
        rp.phone_number,
        rp.current_score,
        rp.total_orders_completed,
        rp.total_orders_cancelled,
        rp.is_frozen,
        rp.updated_at,
        COUNT(DISTINCT o.id) AS total_orders,
        MAX(o.created_at) AS last_order_at
      FROM reputation_profiles rp
      LEFT JOIN order_delivery_info odi
        ON ${normalizedPhoneExpr} = rp.phone_number
      LEFT JOIN orders o
        ON o.id = odi.order_id
        AND o.order_type IN ('delivery', 'takeaway')
      ${whereClause}
      GROUP BY
        rp.phone_number,
        rp.current_score,
        rp.total_orders_completed,
        rp.total_orders_cancelled,
        rp.is_frozen,
        rp.updated_at
      ORDER BY rp.updated_at DESC, rp.phone_number ASC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    return rows;
  }

  async countReputationProfiles({ keyword = "" } = {}) {
    const params = [];
    let whereClause = "";
    if (keyword) {
      whereClause = "WHERE phone_number LIKE ?";
      params.push(`%${keyword}%`);
    }

    const [rows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM reputation_profiles
      ${whereClause}
      `,
      params
    );

    return Number(rows[0]?.total || 0);
  }

  async findReputationHistoryByPhone(phoneNumber, { limit = 50 } = {}) {
    const [rows] = await db.query(
      `
      SELECT
        rh.id,
        rh.phone_number,
        rh.order_id,
        rh.score_before,
        rh.change_amount AS score_change,
        rh.change_amount,
        rh.score_after,
        rh.applied_multiplier,
        rh.reason_type,
        rh.description,
        COALESCE(
          rh.description,
          CASE
            WHEN rh.reason_type = 'ORDER_COMPLETED' THEN 'Hoàn thành đơn hàng'
            WHEN rh.reason_type = 'ORDER_CANCELLED' THEN 'Đơn hàng bị hủy'
            ELSE rh.reason_type
          END,
          'Cập nhật điểm'
        ) AS reason,
        rh.created_at AS happened_at,
        o.order_type,
        o.status,
        o.total_amount
      FROM reputation_history rh
      LEFT JOIN orders o ON o.id = rh.order_id
      WHERE rh.phone_number = ?
      ORDER BY rh.created_at DESC, rh.id DESC
      LIMIT ?
      `,
      [phoneNumber, Number(limit)]
    );

    return rows;
  }
}

module.exports = new ReputationRepository();
