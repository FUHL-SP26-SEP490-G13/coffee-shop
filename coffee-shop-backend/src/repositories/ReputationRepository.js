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
  async getConnection() {
    return db.getConnection();
  }

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

  async findDeliveryInfoByOrderId(connection, orderId) {
    const [rows] = await connection.query(
      `
      SELECT receiver_phone
      FROM order_delivery_info
      WHERE order_id = ?
      LIMIT 1
      `,
      [orderId],
    );

    return rows[0] || null;
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

  async findReputationProfileByPhoneForUpdate(connection, phoneNumber) {
    const [rows] = await connection.query(
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
      FOR UPDATE
      `,
      [phoneNumber],
    );

    return rows[0] || null;
  }

  async updateReputationProfileScore(
    connection,
    { phoneNumber, scoreAfter, completedDelta = 0, cancelledDelta = 0 },
  ) {
    await connection.query(
      `
      UPDATE reputation_profiles
      SET
        current_score = ?,
        total_orders_completed = COALESCE(total_orders_completed, 0) + ?,
        total_orders_cancelled = COALESCE(total_orders_cancelled, 0) + ?,
        updated_at = NOW()
      WHERE phone_number = ?
      `,
      [scoreAfter, completedDelta, cancelledDelta, phoneNumber],
    );
  }

  async createReputationHistory(connection, payload) {
    await connection.query(
      `
      INSERT INTO reputation_history (
        phone_number,
        order_id,
        score_before,
        change_amount,
        score_after,
        applied_multiplier,
        reason_type,
        description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.phone_number,
        payload.order_id || null,
        payload.score_before,
        payload.change_amount,
        payload.score_after,
        payload.applied_multiplier ?? 1,
        payload.reason_type || null,
        payload.description || null,
      ],
    );
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
            WHEN rh.reason_type = 'INITIAL_GIFT' THEN 'Điểm khởi tạo'
            WHEN rh.reason_type = 'ORDER_SUCCESS' THEN 'Hoàn thành đơn hàng'
            WHEN rh.reason_type = 'PAYOS_BONUS' THEN 'Thưởng thanh toán PayOS'
            WHEN rh.reason_type = 'USER_CANCEL' THEN 'Khách hủy đơn'
            WHEN rh.reason_type = 'BOOM_ORDER' THEN 'Khách không nhận đơn'
            WHEN rh.reason_type = 'ABUSIVE_BEHAVIOR' THEN 'Hành vi lạm dụng'
            WHEN rh.reason_type = 'ADMIN_ADJUST' THEN 'Điều chỉnh bởi quản trị viên'
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
