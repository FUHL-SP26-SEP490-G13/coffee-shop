const pool = require("../config/database");

class AdminDBRepository {
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
    WHERE deleted_at IS NULL
      AND valid_from <= NOW()
      AND (valid_until IS NULL OR valid_until >= NOW())
  `);

    return Number(row.total || 0);
  }

  // Biểu đồ doanh thu theo ngày
  async getRevenueSeries({ startDate, endDate }) {
    const [rows] = await pool.query(
      `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, IFNULL(SUM(total_amount),0) as revenue
      FROM orders
      WHERE is_paid = 1
        AND created_at BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
      `,
      [startDate, endDate]
    );

    return rows.map((r) => ({
      date: r.date, // dạng YYYY-MM-DD
      revenue: Number(r.revenue || 0),
    }));
  }

  // Top sản phẩm bán chạy
  async getTopProducts({ startDate, endDate, limit = 5 }) {
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
        AND o.created_at BETWEEN ? AND ?
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT ?
      `,
      [startDate, endDate, safeLimit]
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      quantitySold: Number(r.quantity_sold || 0),
      revenue: Number(r.revenue || 0),
    }));
  }



  // Doanh thu theo loại đơn hàng
  async getOrderTypeRevenue({ startDate, endDate }) {
    const [rows] = await pool.query(
      `
    SELECT order_type, IFNULL(SUM(total_amount),0) as revenue
    FROM orders
    WHERE is_paid = 1
      AND created_at BETWEEN ? AND ?
    GROUP BY order_type
    `,
      [startDate, endDate]
    );

    return rows.map((r) => ({
      type: r.order_type,
      revenue: Number(r.revenue || 0),
    }));
  }

  // So sánh tăng trưởng so với kỳ trước đó có cùng độ dài
  async getComparison({ startDate, endDate, prevStartDate, prevEndDate }) {
    const [[current]] = await pool.query(
      `
    SELECT 
      IFNULL(SUM(total_amount),0) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE is_paid = 1
      AND created_at BETWEEN ? AND ?
    `,
      [startDate, endDate]
    );

    const [[previous]] = await pool.query(
      `
    SELECT 
      IFNULL(SUM(total_amount),0) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE is_paid = 1
      AND created_at BETWEEN ? AND ?
    `,
      [prevStartDate, prevEndDate]
    );

    const calcGrowth = (cur, prev) => {
      if (prev === 0) return 0;
      return ((cur - prev) / prev) * 100;
    };

    return {
      revenueGrowth: Number(
        calcGrowth(Number(current.revenue), Number(previous.revenue)).toFixed(2)
      ),
      orderGrowth: Number(
        calcGrowth(Number(current.orders), Number(previous.orders)).toFixed(2)
      ),
    };
  }


}

module.exports = new AdminDBRepository();
