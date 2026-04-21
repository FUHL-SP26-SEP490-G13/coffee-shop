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
// số lượng đơn hàng đã thanh toán hôm nay
  async getOrdersToday() {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) as total
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    return Number(row.total || 0);
  }
// số lượng khách hàng đã đăng ký tài khoản
  async getTotalUsers() {
    const [[row]] = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);
    return Number(row.total || 0);
  }
// số lượng mã giảm giá đang hoạt động
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
// prevStartDate và prevEndDate đã được tính toán ở service để đảm bảo cùng độ dài với khoảng thời gian hiện tại
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
// Hàm tính phần trăm tăng trưởng, trả về 0 nếu giá trị trước đó là 0 để tránh chia cho 0
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


  // Doanh thu theo phương thức thanh toán
  async getPaymentMethodRevenue({ startDate, endDate }) {
    const [rows] = await pool.query(
      `
    SELECT payment_method, IFNULL(SUM(total_amount),0) as revenue
    FROM orders
    WHERE is_paid = 1
      AND created_at BETWEEN ? AND ?
    GROUP BY payment_method
    `,
      [startDate, endDate]
    );

    return rows.map((r) => ({
      method: r.payment_method,
      revenue: Number(r.revenue || 0),
    }));
  }

  // số lượng đơn hàng theo trạng thái
  async getOrdersSummary({ startDate, endDate }) {
    const [rows] = await pool.query(
      `
    SELECT 
      status, 
      is_paid,
      COUNT(*) as count,
      IFNULL(SUM(total_amount),0) as revenue
    FROM orders
    WHERE created_at BETWEEN ? AND ?
    GROUP BY status, is_paid
    `,
      [startDate, endDate]
    );

    return rows.map((r) => ({
      status: r.status,
      isPaid: Boolean(r.is_paid),
      count: Number(r.count || 0),
      revenue: Number(r.revenue || 0),
    }));
  }
// Báo cáo chi tiết đơn hàng
  async getDetailedOrdersReport({ startDate, endDate }) {
    const [rows] = await pool.query(
      `SELECT 
        o.id as orderId,
        COALESCE(odi.receiver_name, 'Khách vãng lai') as customerName,
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as staffName,
        o.created_at as time,
        COALESCE(op.payment_method, 'N/A') as paymentMethod,
        (SELECT COALESCE(SUM(quantity), 0) FROM order_details WHERE order_id = o.id) as totalQuantity,
        COALESCE(
          NULLIF(o.amount, 0),
          (SELECT COALESCE(SUM(quantity * price), 0) FROM order_details WHERE order_id = o.id)
        ) as totalItemsPrice,
        COALESCE(
          NULLIF(o.discount_amount, 0),
          GREATEST(
            COALESCE(
              NULLIF(o.amount, 0),
              (SELECT COALESCE(SUM(quantity * price), 0) FROM order_details WHERE order_id = o.id)
            ) + COALESCE(o.delivery_fee, 0) - COALESCE(o.total_amount, 0),
            0
          )
        ) as discount,
        COALESCE(o.delivery_fee, 0) as deliveryFee,
        o.total_amount as revenue,
        CASE WHEN o.is_paid = 1 THEN o.total_amount ELSE 0 END as actualCollected,
        CASE WHEN o.is_paid = 0 THEN o.total_amount ELSE 0 END as debt
      FROM orders o
      LEFT JOIN order_payments op ON o.id = op.order_id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN order_delivery_info odi ON o.id = odi.order_id
      WHERE o.created_at >= ? AND o.created_at <= ?
      AND o.is_paid = 1
      AND o.status != 'cancelled'
      ORDER BY o.created_at DESC`,
      [startDate, endDate]
    );
    return rows;
  }

  // Báo cáo theo ca làm việc (shifts are dynamic – loaded from shift_templates)
  async getShiftReport({ date }) {
    // 1. Load all active shift templates
    const [templates] = await pool.query(
      `SELECT id, name, start_time, end_time, color FROM shift_templates WHERE is_deleted = 0 ORDER BY start_time`
    );

    // 2. For each template, count orders AND fetch order list within that time window
    const shiftStats = await Promise.all(
      templates.map(async (tpl) => {
        const start = tpl.start_time.slice(0, 5); // HH:MM
        const end   = tpl.end_time.slice(0, 5);

        // Overnight shift: end_time <= start_time (e.g. 23:00 → 07:00)
        const isOvernight = end <= start;

        const timeCondition = isOvernight
          ? `(TIME(o.created_at) >= ? OR TIME(o.created_at) < ?)`
          : `(TIME(o.created_at) >= ? AND TIME(o.created_at) < ?)`;

        // Summary stats
        const [[stats]] = await pool.query(
          `SELECT
              COUNT(*) AS totalOrders,
              SUM(o.is_paid = 1) AS completedOrders,
              IFNULL(SUM(CASE WHEN o.is_paid = 1 THEN o.total_amount ELSE 0 END), 0) AS revenue
           FROM orders o
           WHERE DATE(o.created_at) = ?
             AND o.status != 'cancelled'
             AND ${timeCondition}`,
          [date, start, end]
        );

        // Order detail rows (same fields as getDetailedOrdersReport)
        const [orders] = await pool.query(
          `SELECT
              o.id AS orderId,
              COALESCE(odi.receiver_name, 'Khách vãng lai') AS customerName,
              CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) AS staffName,
              o.created_at AS time,
              COALESCE(op.payment_method, 'N/A') AS paymentMethod,
              (SELECT COALESCE(SUM(quantity), 0) FROM order_details WHERE order_id = o.id) AS totalQuantity,
              COALESCE(NULLIF(o.amount, 0),
                (SELECT COALESCE(SUM(quantity * price), 0) FROM order_details WHERE order_id = o.id)
              ) AS totalItemsPrice,
              COALESCE(o.delivery_fee, 0) AS deliveryFee,
              o.total_amount AS revenue,
              o.is_paid AS isPaid,
              o.status
           FROM orders o
           LEFT JOIN order_payments op ON o.id = op.order_id
           LEFT JOIN users u ON o.created_by = u.id
           LEFT JOIN order_delivery_info odi ON o.id = odi.order_id
           WHERE DATE(o.created_at) = ?
             AND o.status != 'cancelled'
             AND ${timeCondition}
           ORDER BY o.created_at DESC`,
          [date, start, end]
        );

        // Cash session metrics for this shift template on the given date
        // cash_sessions.shift_registration_id → shift_registrations → shifts → shift_templates
        const [[cashSession]] = await pool.query(
          `SELECT
              IFNULL(SUM(cs.opening_cash), 0)        AS openingCash,
              IFNULL(SUM(cs.closing_cash_actual), 0) AS closingCash,
              IFNULL(SUM(cs.cash_difference), 0)     AS cashDifference,
              COUNT(cs.id)                           AS sessionCount,
              SUM(cs.status = 'open')                AS openSessions
           FROM cash_sessions cs
           JOIN shift_registrations sr ON cs.shift_registration_id = sr.id
           JOIN shifts sh              ON sr.shift_id = sh.id
           WHERE sh.template_id = ?
             AND DATE(cs.opened_at) = ?`,
          [tpl.id, date]
        );

        return {
          templateId:       tpl.id,
          name:             tpl.name,
          startTime:        tpl.start_time.slice(0, 5),
          endTime:          tpl.end_time.slice(0, 5),
          color:            tpl.color,
          totalOrders:      Number(stats.totalOrders    || 0),
          completedOrders:  Number(stats.completedOrders || 0),
          revenue:          Number(stats.revenue          || 0),
          orders,
          cashSession: {
            openingCash:    Number(cashSession.openingCash    || 0),
            closingCash:    Number(cashSession.closingCash    || 0),
            cashDifference: Number(cashSession.cashDifference || 0),
            sessionCount:   Number(cashSession.sessionCount   || 0),
            openSessions:   Number(cashSession.openSessions   || 0),
          },
        };
      })
    );

    // 3. Cash metrics for the full date
    // storeCash: paid cash orders
    const [[storeCashRow]] = await pool.query(
      `SELECT IFNULL(SUM(op.paid_amount), 0) AS storeCash
       FROM order_payments op
       JOIN orders o ON o.id = op.order_id
       WHERE op.payment_method = 'cash'
         AND o.is_paid = 1
         AND DATE(o.created_at) = ?`,
      [date]
    );

    // employeeCash: cash orders that are NOT yet settled (is_paid = 0)
    // payment_method lives on order_payments, not on orders
    const [[empCashRow]] = await pool.query(
      `SELECT IFNULL(SUM(o.total_amount), 0) AS employeeCash
       FROM orders o
       JOIN order_payments op ON op.order_id = o.id
       WHERE op.payment_method = 'cash'
         AND o.is_paid = 0
         AND o.status != 'cancelled'
         AND DATE(o.created_at) = ?`,
      [date]
    );

    return {
      date,
      shifts: shiftStats,
      cashMetrics: {
        storeCash:    Number(storeCashRow.storeCash   || 0),
        employeeCash: Number(empCashRow.employeeCash  || 0),
      },
    };
  }

  // Báo cáo chi tiết sản phẩm
  async getProductReport({ startDate, endDate }) {
    const [rows] = await pool.query(
      `SELECT 
        p.code as productCode,
        p.name as productName,
        ps.size as size,
        SUM(od.quantity) as quantitySold,
        ps.price as listPrice,
        SUM(od.quantity * od.price) as revenue,
        0 as difference,
        0 as returnQuantity,
        0 as returnValue,
        SUM(od.quantity * od.price) as netRevenue
      FROM order_details od
      JOIN orders o ON o.id = od.order_id
      JOIN product_sizes ps ON ps.id = od.product_size_id
      JOIN products p ON p.id = ps.product_id
      WHERE o.is_paid = 1
        AND o.status != 'cancelled'
        AND o.created_at >= ? AND o.created_at <= ?
      GROUP BY p.id, p.code, p.name, ps.id, ps.size, ps.price
      ORDER BY quantitySold DESC`,
      [startDate, endDate]
    );
    return rows;
  }

  // Báo cáo theo thời gian
  async getTimeReport({ startDate, endDate }) {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(o.created_at, '%H:00') as timeHour,
        COUNT(o.id) as orderCount,
        SUM(COALESCE(NULLIF(o.amount, 0), (SELECT SUM(quantity * price) FROM order_details WHERE order_id = o.id))) as totalItemsPrice,
        SUM(COALESCE(o.discount_amount, 0)) as discount,
        SUM(o.total_amount) as revenue,
        0 as returnCount,
        0 as returnValue,
        SUM(o.total_amount) as netRevenue
      FROM orders o
      WHERE o.is_paid = 1
        AND o.status != 'cancelled'
        AND o.created_at >= ? AND o.created_at <= ?
      GROUP BY DATE_FORMAT(o.created_at, '%H:00')
      ORDER BY timeHour ASC`,
      [startDate, endDate]
    );

    // For each hour, fetch the individual orders
    const result = await Promise.all(
      rows.map(async (row) => {
        const [orders] = await pool.query(
          `SELECT 
            o.id as orderId,
            o.created_at as time,
            CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as staffName,
            COALESCE(odi.receiver_name, 'Khách vãng lai') as customerName,
            COALESCE(NULLIF(o.amount, 0), (SELECT SUM(quantity * price) FROM order_details WHERE order_id = o.id)) as totalItemsPrice,
            COALESCE(o.discount_amount, 0) as discount,
            o.total_amount as revenue
          FROM orders o
          LEFT JOIN users u ON o.created_by = u.id
          LEFT JOIN order_delivery_info odi ON o.id = odi.order_id
          WHERE o.is_paid = 1
            AND o.status != 'cancelled'
            AND o.created_at >= ? AND o.created_at <= ?
            AND DATE_FORMAT(o.created_at, '%H:00') = ?
          ORDER BY o.created_at DESC`,
          [startDate, endDate, row.timeHour]
        );
        return { ...row, orders };
      })
    );

    return result;
  }

  // Báo cáo theo nhân viên
  async getStaffReport({ startDate, endDate }) {
    const [rows] = await pool.query(
      `SELECT 
        u.id as staffId,
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as staffName,
        COUNT(o.id) as orderCount,
        SUM(COALESCE(NULLIF(o.amount, 0), (SELECT SUM(quantity * price) FROM order_details WHERE order_id = o.id))) as totalItemsPrice,
        SUM(COALESCE(o.discount_amount, 0)) as discount,
        SUM(o.total_amount) as revenue,
        0 as returnCount,
        0 as returnValue,
        SUM(o.total_amount) as netRevenue
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.is_paid = 1
        AND o.status != 'cancelled'
        AND o.created_at >= ? AND o.created_at <= ?
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY revenue DESC`,
      [startDate, endDate]
    );

    // For each staff member, fetch the individual orders
    const result = await Promise.all(
      rows.map(async (row) => {
        const [orders] = await pool.query(
          `SELECT 
            o.id as orderId,
            o.created_at as time,
            COALESCE(odi.receiver_name, 'Khách vãng lai') as customerName,
            COALESCE(NULLIF(o.amount, 0), (SELECT SUM(quantity * price) FROM order_details WHERE order_id = o.id)) as totalItemsPrice,
            COALESCE(o.discount_amount, 0) as discount,
            o.total_amount as revenue
          FROM orders o
          LEFT JOIN order_delivery_info odi ON o.id = odi.order_id
          WHERE o.is_paid = 1
            AND o.status != 'cancelled'
            AND o.created_at >= ? AND o.created_at <= ?
            AND o.created_by = ?
          ORDER BY o.created_at DESC`,
          [startDate, endDate, row.staffId]
        );
        return { ...row, orders };
      })
    );

    return result;
  }
}

module.exports = new AdminDBRepository();
