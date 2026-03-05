const pool = require("../config/database");

class BaristaDashboardRepository {
  async getOverview() {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(status='pending') AS pendingOrders,
        SUM(status='preparing') AS preparingOrders,
        SUM(status='served') AS readyOrders,
        SUM(status='completed') AS completedToday
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    const [[avgTime]] = await pool.query(`
      SELECT 
        IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, paid_at)),0) AS avgPrepTime
      FROM orders
      WHERE status='completed'
      AND DATE(created_at)=CURDATE()
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
    const [rows] = await pool.query(
      `
      SELECT
        HOUR(created_at) AS hour,
        COUNT(*) AS orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL ? HOUR
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `,
      [hours]
    );

    return rows;
  }
}

module.exports = new BaristaDashboardRepository();
