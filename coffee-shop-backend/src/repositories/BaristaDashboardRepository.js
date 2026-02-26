const pool = require("../config/database");

class BaristaDashboardRepository {
  async getOverview() {
    const [[totalOrders]] = await pool.query(`
      SELECT COUNT(*) AS totalOrders
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    const [[pendingOrders]] = await pool.query(`
      SELECT COUNT(*) AS pendingOrders
      FROM orders
      WHERE status = 'pending'
    `);

    const [[preparingOrders]] = await pool.query(`
      SELECT COUNT(*) AS preparingOrders
      FROM orders
      WHERE status = 'preparing'
    `);

    const [[readyOrders]] = await pool.query(`
      SELECT COUNT(*) AS readyOrders
      FROM orders
      WHERE status = 'served'
    `);

    const [[completedToday]] = await pool.query(`
      SELECT COUNT(*) AS completedToday
      FROM orders
      WHERE status = 'completed'
      AND DATE(created_at) = CURDATE()
    `);

    const [[avgPrepTime]] = await pool.query(`
      SELECT IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, paid_at)), 0) AS avgPrepTime
      FROM orders
      WHERE status = 'completed'
      AND DATE(created_at) = CURDATE()
    `);

    return {
      totalOrders: totalOrders.totalOrders,
      pendingOrders: pendingOrders.pendingOrders,
      preparingOrders: preparingOrders.preparingOrders,
      readyOrders: readyOrders.readyOrders,
      completedToday: completedToday.completedToday,
      avgPrepTime: Math.round(avgPrepTime.avgPrepTime),
    };
  }

  async getOrderTrends(hours = 6) {
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
      [hours]
    );

    return rows;
  }
}

module.exports = new BaristaDashboardRepository();
