const pool = require("../config/database");
const CashSessionRepository = require("./CashSessionRepository");

class BaristaDBRepository {
  async getOverview() {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(status = 'pending') AS pendingOrders,
        SUM(status = 'preparing') AS preparingOrders,
        SUM(status = 'served') AS readyOrders,
        SUM(status = 'completed') AS completedToday
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    const [[avgTime]] = await pool.query(`
      SELECT 
        IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, paid_at)), 0) AS avgPrepTime
      FROM orders
      WHERE status = 'completed'
        AND DATE(created_at) = CURDATE()
        AND paid_at IS NOT NULL
    `);

    return {
      totalOrders: Number(stats.totalOrders || 0),
      pendingOrders: Number(stats.pendingOrders || 0),
      preparingOrders: Number(stats.preparingOrders || 0),
      readyOrders: Number(stats.readyOrders || 0),
      completedToday: Number(stats.completedToday || 0),
      avgPrepTime: Math.round(avgTime.avgPrepTime || 0),
    };
  }

  async getOrderTrends(hours = 6) {
    const safeHours = Math.max(1, Math.min(Number(hours) || 6, 24));

    const [rows] = await pool.query(
      `
      SELECT
        HOUR(created_at) AS hour,
        COUNT(*) AS orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL ? HOUR
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
      `,
      [safeHours]
    );

    return rows.map((row) => ({
      hour: Number(row.hour),
      orders: Number(row.orders),
    }));
  }

  async getActiveOrders(statuses = ["pending", "preparing", "served"], filters = {}) {
    const normalizedStatuses = Array.isArray(statuses)
      ? statuses
          .map((status) => String(status || "").trim().toLowerCase())
          .filter((status) =>
            ["pending", "preparing", "served", "delivering", "completed", "cancelled"].includes(
              status
            )
          )
      : [];

    const finalStatuses = normalizedStatuses.length
      ? normalizedStatuses
      : ["pending", "preparing", "served"];

    const placeholders = finalStatuses.map(() => "?").join(", ");

    let dateFilterSql = "";
    const queryParams = [...finalStatuses];

    if (filters.startDate && filters.endDate) {
      dateFilterSql = " AND o.created_at >= ? AND o.created_at <= ? + INTERVAL 1 DAY - INTERVAL 1 SECOND";
      queryParams.push(filters.startDate, filters.endDate);
    } else if (filters.today) {
      dateFilterSql = " AND DATE(o.created_at) = CURDATE()";
    }

    const currentSession = await CashSessionRepository.getCurrentSession();
    if (currentSession && currentSession.id) {
       dateFilterSql += " AND (o.cash_session_id IS NULL OR o.cash_session_id = ?)";
       queryParams.push(currentSession.id);
    } else {
       dateFilterSql += " AND o.cash_session_id IS NULL";
    }

    const [rows] = await pool.query(
      `
      SELECT
        o.id,
        o.order_type,
        o.status,
        o.print_status,
        o.is_paid,
        o.created_at,
        o.total_amount,
        o.delivery_fee,
        o.used_points,
        op.payment_method,
        op.payment_status,
        odi.receiver_name,
        odi.receiver_phone,
        odi.address,
        odi.note AS delivery_note,
        t.code AS table_code,
        COUNT(od.id) AS itemCount
      FROM orders o
      LEFT JOIN order_details od ON od.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
      LEFT JOIN order_delivery_info odi ON odi.order_id = o.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.status IN (${placeholders}) ${dateFilterSql}
      GROUP BY
        o.id,
        o.order_type,
        o.status,
        o.print_status,
        o.is_paid,
        o.created_at,
        o.total_amount,
        o.delivery_fee,
        o.used_points,
        op.payment_method,
        op.payment_status,
        odi.receiver_name,
        odi.receiver_phone,
        odi.address,
        odi.note,
        t.code
      ORDER BY
        FIELD(o.status, 'pending', 'preparing', 'served', 'delivering', 'completed', 'cancelled'),
        o.created_at ASC
    `,
      queryParams
    );

    return rows;
  }

  async getOrderItems(orderId) {
    const [rows] = await pool.query(
      `
      SELECT
        od.id,
        p.id AS productId,
        p.name AS productName,
        p.name AS product_name,
        ps.id AS productSizeId,
        ps.size,
        ps.size AS product_size,
        od.quantity,
        od.price,
        od.note
      FROM order_details od
      INNER JOIN product_sizes ps ON od.product_size_id = ps.id
      INNER JOIN products p ON ps.product_id = p.id
      WHERE od.order_id = ?
      ORDER BY od.id ASC
      `,
      [orderId]
    );

    for (const item of rows) {
      const [toppings] = await pool.query(
        `
        SELECT
          odt.id,
          odt.topping_id,
          odt.quantity,
          odt.price,
          t.name
        FROM order_detail_toppings odt
        JOIN toppings t ON t.id = odt.topping_id
        WHERE odt.order_detail_id = ?
        `,
        [item.id] // Use item.id from order_details
      );

      item.toppings = toppings;
    }

    return rows;
  }

  async getDelayedOrders(minutes = 15) {
    const safeMinutes = Math.max(1, Math.min(Number(minutes) || 15, 180));

    const [rows] = await pool.query(
      `
      SELECT
        o.id,
        o.order_type,
        o.status,
        o.created_at,
        o.total_amount,
        TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) AS waitingMinutes
      FROM orders o
      WHERE o.status IN ('pending', 'preparing')
        AND o.created_at <= NOW() - INTERVAL ? MINUTE
      ORDER BY o.created_at ASC
      `,
      [safeMinutes]
    );

    return rows.map((row) => ({
      ...row,
      waitingMinutes: Number(row.waitingMinutes || 0),
    }));
  }

  async getTopProductsToday(limit = 5) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        SUM(od.quantity) AS totalSold,
        COUNT(DISTINCT od.order_id) AS totalOrders
      FROM orders o
      INNER JOIN order_details od ON o.id = od.order_id
      INNER JOIN product_sizes ps ON od.product_size_id = ps.id
      INNER JOIN products p ON ps.product_id = p.id
      WHERE DATE(o.created_at) = CURDATE()
        AND o.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY totalSold DESC, totalOrders DESC
      LIMIT ?
      `,
      [safeLimit]
    );

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      totalSold: Number(row.totalSold || 0),
      totalOrders: Number(row.totalOrders || 0),
    }));
  }
}

module.exports = new BaristaDBRepository();
