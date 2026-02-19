const pool = require("../config/database");

class AdminDashboardRepository {
  async getRevenueToday() {
    const [[row]] = await pool.query(`
      SELECT IFNULL(SUM(total_amount),0) as revenue
      FROM orders
      WHERE is_paid = 1 AND DATE(created_at) = CURDATE()
    `);
    return Number(row.revenue || 0);
  }

  async getOrdersToday() {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) as total
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    return Number(row.total || 0);
  }

  async getTotalUsers() {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);
    return Number(row.total || 0);
  }

  async getActiveDiscounts() {
    const [[row]] = await pool.query(`
    SELECT COUNT(*) as total
    FROM discount
    WHERE (valid_until IS NULL OR valid_until >= NOW())
      AND is_active = 1
  `);

    return Number(row.total || 0);
  }

  // Biểu đồ doanh thu theo ngày (last N days)
  async getRevenueSeries({ days = 7 }) {
    const safeDays = Math.max(1, Math.min(Number(days) || 7, 90));

    // lấy từ (days-1) ngày trước đến hôm nay
    const [rows] = await pool.query(
      `
      SELECT DATE(created_at) as date, IFNULL(SUM(total_amount),0) as revenue
      FROM orders
      WHERE is_paid = 1
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      `,
      [safeDays - 1]
    );

    return rows.map((r) => ({
      date: r.date, // dạng YYYY-MM-DD
      revenue: Number(r.revenue || 0),
    }));
  }

  // Top sản phẩm bán chạy (last N days)
  async getTopProducts({ days = 7, limit = 5 }) {
    const safeDays = Math.max(1, Math.min(Number(days) || 7, 90));
    const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

    const [rows] = await pool.query(
      `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(od.quantity) as quantity_sold,
        SUM(od.quantity * od.price) as revenue
      FROM order_details od
      JOIN orders o ON o.id = od.order_id
      JOIN product_sizes ps ON ps.id = od.product_size_id
      JOIN products p ON p.id = ps.product_id
      WHERE o.is_paid = 1
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT ?
      `,
      [safeDays - 1, safeLimit]
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      quantitySold: Number(r.quantity_sold || 0),
      revenue: Number(r.revenue || 0),
    }));
  }

  // Gợi ý thêm: doanh thu theo phương thức thanh toán (last N days)
  async getPaymentMethodBreakdown({ days = 7 }) {
    const safeDays = Math.max(1, Math.min(Number(days) || 7, 90));
    const [rows] = await pool.query(
      `
      SELECT op.payment_method as method, IFNULL(SUM(op.amount),0) as revenue
      FROM order_payments op
      JOIN orders o ON o.id = op.order_id
      WHERE op.payment_status = 'paid'
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY op.payment_method
      ORDER BY revenue DESC
      `,
      [safeDays - 1]
    );

    return rows.map((r) => ({
      method: r.method,
      revenue: Number(r.revenue || 0),
    }));
  }

  async getTotalNewsletterSubscribers() {
    const sql = `
    SELECT COUNT(*) AS total
    FROM newsletter_subscribers
  `;
    const [rows] = await pool.query(sql);
    return rows[0].total;
  }
}

module.exports = new AdminDashboardRepository();
