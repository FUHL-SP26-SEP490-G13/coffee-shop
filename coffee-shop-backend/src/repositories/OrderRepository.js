const db = require("../config/database");
const CashSessionRepository = require("./CashSessionRepository");

class OrderRepository {
  async getConnection() {
    return await db.getConnection();
  }

  async findProductSizeById(connection, productSizeId) {
    const [rows] = await connection.query(
      `
      SELECT 
        ps.id,
        ps.price,
        ps.size,
        p.id AS product_id,
        p.name,
        p.status
      FROM product_sizes ps
      JOIN products p ON p.id = ps.product_id
      WHERE ps.id = ? AND ps.is_deleted = 0
      `,
      [productSizeId]
    );

    return rows[0];
  }

  async findToppingById(connection, toppingId) {
    const [rows] = await connection.query(
      `
      SELECT id, name, price
      FROM toppings
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
      `,
      [toppingId]
    );

    return rows[0];
  }

  async findDiscountByCodeForCheckout(connection, code) {
    const [rows] = await connection.query(
      `
      SELECT *
      FROM discount
      WHERE LOWER(code) = LOWER(?) AND deleted_at IS NULL
      LIMIT 1
      `,
      [code]
    );

    return rows[0] || null;
  }

  async incrementDiscountUsedCount(connection, discountId) {
    await connection.query(
      `
      UPDATE discount
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE id = ?
      `,
      [discountId]
    );
  }

  async createOrder(connection, data) {
    const safeStatus = data.status || "pending";
    const safeUsedPoints = Math.max(0, Number(data.used_points) || 0);
    // amount = subtotal trước giảm giá, discount_amount = số tiền đã giảm
    const safeAmount = Math.max(0, Number(data.amount ?? data.total_amount) || 0);
    const safeDiscountAmount = Math.max(0, Number(data.discount_amount) || 0);

    const currentSession = await CashSessionRepository.findOpenSession();
    const cashSessionId = currentSession ? currentSession.id : null;

    const [result] = await connection.query(
      `
      INSERT INTO orders (
        user_id,
        customer_type,
        order_type,
        table_id,
        status,
        is_paid,
        amount,
        discount_amount,
        total_amount,
        delivery_fee,
        used_points,
        session_id,
        cash_session_id,
        note,
        staff_id
      )
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.user_id,
        data.customer_type,
        data.order_type,
        data.table_id || null,
        safeStatus,
        safeAmount,
        safeDiscountAmount,
        data.total_amount,
        Math.max(0, Number(data.delivery_fee) || 0),
        safeUsedPoints,
        data.session_id || null,
        cashSessionId,
        data.note || null,
        data.staff_id || null,
      ]
    );

    return result.insertId;
  }

  async createOrderDetail(connection, data) {
    const [result] = await connection.query(
      `
    INSERT INTO order_details (
      order_id,
      product_size_id,
      quantity,
      price
    )
    VALUES (?, ?, ?, ?)
    `,
      [data.order_id, data.product_size_id, data.quantity, data.price]
    );

    return result.insertId;
  }

  async createOrderDetailTopping(connection, data) {
    await connection.query(
      `
      INSERT INTO order_detail_toppings (
        order_detail_id,
        topping_id,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?)
      `,
      [data.order_detail_id, data.topping_id, data.quantity, data.price]
    );
  }

  async createOrderDeliveryInfo(connection, data) {
    await connection.query(
      `
      INSERT INTO order_delivery_info (
        order_id,
        receiver_name,
        receiver_phone,
        receiver_email,
        address,
        note,
        latitude,
        longitude
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.order_id,
        data.receiver_name,
        data.receiver_phone,
        data.receiver_email,
        data.address,
        data.note,
        data.latitude || null,
        data.longitude || null,
      ]
    );
  }

  async createOrderPayment(connection, data) {
    const isCash = data.payment_method === "cash";
    const amount = Number(data.amount) || 0;
    const paymentStatus = data.payment_status || "pending";
    const isPaid = paymentStatus === "paid";

    const normalizedPaidAmount = Number.isFinite(Number(data.paid_amount))
      ? Number(data.paid_amount)
      : isPaid
      ? amount
      : 0;

    const normalizedCashReceived = Number.isFinite(Number(data.cash_received))
      ? Number(data.cash_received)
      : isPaid
      ? normalizedPaidAmount
      : 0;

    const normalizedChangeAmount = Number.isFinite(Number(data.change_amount))
      ? Math.max(0, Number(data.change_amount))
      : isPaid
      ? Math.max(0, normalizedCashReceived - normalizedPaidAmount)
      : 0;

    await connection.query(
      `
      INSERT INTO order_payments (
        order_id,
        payment_method,
        payment_status,
        amount,
        paid_amount,
        cash_received,
        change_amount,
        transaction_id,
        paid_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.order_id,
        data.payment_method,
        paymentStatus,
        amount,
        normalizedPaidAmount,
        normalizedCashReceived,
        normalizedChangeAmount,
        data.transaction_id || null,
        isPaid ? new Date() : null,
      ]
    );
  }

  async markOrderAsPaid(connection, orderId) {
    await connection.query(
      `
      UPDATE orders
      SET is_paid = 1,
          paid_at = NOW()
      WHERE id = ?
      `,
      [orderId]
    );
  }

  async updatePaymentByOrderCode(orderCode, { transaction_id, payment_status }) {
    const setParts = [];
    const params = [];

    if (transaction_id !== undefined) {
      setParts.push("transaction_id = ?");
      params.push(transaction_id);
    }
    if (payment_status !== undefined) {
      setParts.push("payment_status = ?");
      params.push(payment_status);
      if (payment_status === "paid") {
        setParts.push("paid_at = NOW()");
        setParts.push("paid_amount = amount");
        setParts.push("cash_received = amount");
        setParts.push("change_amount = 0");
      }
    }

    if (setParts.length === 0) return;

    params.push(Number(orderCode));
    await db.query(
      `UPDATE order_payments SET ${setParts.join(", ")} WHERE order_id = ?`,
      params
    );
  }

  async updateOrderPaidStatus(orderCode, isPaid) {
    await db.query(
      `UPDATE orders SET is_paid = ?, paid_at = IF(? = 1, NOW(), paid_at) WHERE id = ?`,
      [isPaid ? 1 : 0, isPaid ? 1 : 0, Number(orderCode)]
    );
  }

  async updateOrderStatus(orderId, status) {
    await db.query(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, orderId]
    );
  }

  async updateOrderPrintStatus(orderId, printStatus) {
    await db.query(
      `
      UPDATE orders
      SET print_status = ?
      WHERE id = ?
      `,
      [printStatus, orderId]
    );
  }

  async updatePaymentStatusByOrderId(orderId, paymentStatus, paymentMeta = {}) {
    const setParts = ["payment_status = ?"];
    const params = [paymentStatus];

    if (paymentStatus === "paid") {
      const paidAmount = Number(paymentMeta.paid_amount);
      const hasPaidAmount = Number.isFinite(paidAmount);

      const cashReceived = Number(paymentMeta.cash_received);
      const hasCashReceived = Number.isFinite(cashReceived);

      const changeAmount = Number(paymentMeta.change_amount);
      const hasChangeAmount = Number.isFinite(changeAmount);

      setParts.push("paid_at = NOW()");

      if (hasPaidAmount) {
        setParts.push("paid_amount = ?");
        params.push(paidAmount);
      } else {
        setParts.push("paid_amount = amount");
      }

      if (hasCashReceived) {
        setParts.push("cash_received = ?");
        params.push(cashReceived);
      } else {
        setParts.push("cash_received = amount");
      }

      if (hasChangeAmount) {
        setParts.push("change_amount = ?");
        params.push(Math.max(0, changeAmount));
      } else if (hasCashReceived) {
        if (hasPaidAmount) {
          setParts.push("change_amount = ?");
          params.push(Math.max(0, cashReceived - paidAmount));
        } else {
          setParts.push("change_amount = GREATEST(? - amount, 0)");
          params.push(cashReceived);
        }
      } else {
        setParts.push("change_amount = 0");
      }
    }

    await db.query(
      `
      UPDATE order_payments
      SET ${setParts.join(", ")}
      WHERE order_id = ?
      `,
      [...params, orderId]
    );
  }

  async cancelOrderByUser(orderId, userId, { reason } = {}) {
    const [result] = await db.query(
      `
      UPDATE orders
      SET status = 'cancelled',
          cancel_reason = ?,
          cancel_user_id = ?,
          cancel_role = 'customer',
          cancelled_at = NOW()
      WHERE id = ?
        AND user_id = ?
        AND status = 'pending'
        AND is_paid = 0
      `,
      [reason || null, userId, orderId, userId]
    );

    return result;
  }

  async cancelOrderByStaff(orderId, staffId, staffRole, { reason } = {}) {
    const [result] = await db.query(
      `
      UPDATE orders
      SET status = 'cancelled',
          cancel_reason = ?,
          cancel_user_id = ?,
          cancel_role = ?,
          cancelled_at = NOW()
      WHERE id = ?
        AND status = 'pending'
        AND is_paid = 0
      `,
      [reason || null, staffId || null, staffRole || 'staff', orderId]
    );

    return result;
  }

  async findOrdersByUser(userId) {
    const [rows] = await db.query(
      `
      SELECT 
        id,
        customer_type,
        order_type,
        status,
        cancel_reason,
        cancel_user_id,
        cancel_role,
        cancelled_at,
        is_paid,
        total_amount,
        delivery_fee,
        used_points,
        created_at,
        paid_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return rows;
  }

  async findOrderByIdAndUser(orderId, userId) {
    const [rows] = await db.query(
      `
      SELECT 
        o.id,
        o.customer_type,
        o.order_type,
        o.status,
        o.print_status,
        o.cancel_reason,
        o.cancel_user_id,
        o.cancel_role,
        o.cancelled_at,
        o.is_paid,
        o.total_amount,
        o.amount,
        o.discount_amount,
        o.delivery_fee,
        o.used_points,
        o.created_at,
        o.paid_at,
        odi.receiver_name,
        odi.receiver_phone,
        odi.receiver_email,
        odi.address,
        odi.note,
        op.payment_method,
        op.payment_status,
        op.amount AS payment_amount
      FROM orders o
      LEFT JOIN order_delivery_info odi ON odi.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE o.id = ? AND o.user_id = ?
      LIMIT 1
      `,
      [orderId, userId]
    );

    return rows[0];
  }

  async findOrderById(orderId) {
    const [rows] = await db.query(
      `
      SELECT
        o.id,
        o.user_id,
        o.customer_type,
        o.order_type,
        o.table_id,
        o.session_id,
        o.status,
        o.cancel_reason,
        o.cancel_user_id,
        o.cancel_role,
        o.cancelled_at,
        o.is_paid,
        o.total_amount,
        o.amount,
        o.discount_amount,
        o.delivery_fee,
        o.used_points,
        o.created_at,
        op.payment_method,
        op.payment_status
      FROM orders o
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
      `,
      [orderId]
    );

    return rows[0] || null;
  }

  async findOrderDetailForStaff(orderId) {
    const [rows] = await db.query(
      `
      SELECT
        o.id,
        o.customer_type,
        o.order_type,
        o.status,
        o.cancel_reason,
        o.cancel_user_id,
        o.cancel_role,
        o.cancelled_at,
        o.is_paid,
        o.total_amount,
        o.amount,
        o.discount_amount,
        o.delivery_fee,
        o.used_points,
        o.created_at,
        o.paid_at,
        odi.receiver_name,
        odi.receiver_phone,
        odi.receiver_email,
        odi.address,
        odi.note,
        op.payment_method,
        op.payment_status,
        op.amount AS payment_amount
      FROM orders o
      LEFT JOIN order_delivery_info odi ON odi.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
      `,
      [orderId]
    );

    return rows[0] || null;
  }

  async findOrderItems(orderId) {
    const [rows] = await db.query(
      `
      SELECT 
        od.id,
        od.product_size_id,
        p.id AS product_id,
        od.quantity,
        od.price,
        ps.size,
        p.name,
        COALESCE(pi_thumb.image_url, pi_first.image_url) AS image_url
      FROM order_details od
      JOIN product_sizes ps ON ps.id = od.product_size_id
      JOIN products p ON p.id = ps.product_id
      LEFT JOIN product_images pi_thumb
        ON pi_thumb.product_id = p.id
        AND pi_thumb.isThumbnail = 1
        AND pi_thumb.is_deleted = 0
      LEFT JOIN product_images pi_first
        ON pi_first.id = (
          SELECT pi2.id
          FROM product_images pi2
          WHERE pi2.product_id = p.id
            AND pi2.is_deleted = 0
          ORDER BY pi2.isThumbnail DESC, pi2.id ASC
          LIMIT 1
        )
      WHERE od.order_id = ?
      `,
      [orderId]
    );

    for (const item of rows) {
      const [toppings] = await db.query(
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
        [item.id]
      );

      item.toppings = toppings;
    }

    return rows;
  }

  async findActiveOrderByTableId(connection, tableId) {
    const [rows] = await connection.query(
      `
      SELECT id, total_amount, amount, discount_amount
      FROM orders
      WHERE table_id = ? AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [tableId]
    );

    return rows[0] || null;
  }

  async updateOrderTotalAmount(
    connection,
    orderId,
    { totalAmount, amount, discountAmount }
  ) {
    await connection.query(
      `
      UPDATE orders
      SET total_amount = ?,
          amount = ?,
          discount_amount = ?
      WHERE id = ?
      `,
      [totalAmount, amount, discountAmount, orderId]
    );
  }

  // Đếm số đơn hàng online tiền mặt chưa thanh toán (pending) của một user
  async countPendingUnpaidOnlineOrdersByUser(connection, userId) {
    const [rows] = await connection.query(
      `
      SELECT COUNT(DISTINCT o.id) AS total
      FROM orders o
      JOIN order_payments op ON op.order_id = o.id
      WHERE o.user_id = ?
        AND o.order_type IN ('delivery', 'takeaway')
        AND o.status = 'pending'
        AND o.is_paid = 0
        AND op.payment_method = 'cash'
        AND op.payment_status = 'pending'
      `,
      [userId]
    );

    return Number(rows[0]?.total || 0);
  }

  // Đếm số đơn hàng online tiền mặt chưa thanh toán (pending) theo số điện thoại
  // (dùng cho khách vãng lai)
  async countPendingUnpaidOnlineOrdersByPhone(connection, normalizedPhone) {
    const phoneDigitsExpr = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(COALESCE(odi.receiver_phone, '')), ' ', ''), '.', ''), '-', ''), '(', ''), ')', ''), '+', '')`;
    const normalizedPhoneExpr = `
      CASE
        WHEN LEFT(${phoneDigitsExpr}, 2) = '84' AND CHAR_LENGTH(${phoneDigitsExpr}) >= 11
          THEN CONCAT('0', SUBSTRING(${phoneDigitsExpr}, 3))
        WHEN CHAR_LENGTH(${phoneDigitsExpr}) = 9
          THEN CONCAT('0', ${phoneDigitsExpr})
        ELSE ${phoneDigitsExpr}
      END
    `;

    const [rows] = await connection.query(
      `
      SELECT COUNT(DISTINCT o.id) AS total
      FROM orders o
      JOIN order_payments op ON op.order_id = o.id
      JOIN order_delivery_info odi ON odi.order_id = o.id
      WHERE o.order_type IN ('delivery', 'takeaway')
        AND o.status = 'pending'
        AND o.is_paid = 0
        AND op.payment_method = 'cash'
        AND op.payment_status = 'pending'
        AND ${normalizedPhoneExpr} = ?
      `,
      [normalizedPhone]
    );

    return Number(rows[0]?.total || 0);
  }

  buildAdminOrderFilters({
    status = "all",
    order_type = "all",
    order_code = "",
    start_date = "",
    end_date = "",
  } = {}) {
    const whereClauses = [];
    const params = [];

    if (status && status !== "all") {
      whereClauses.push("o.status = ?");
      params.push(String(status).trim().toLowerCase());
    }

    if (order_type && order_type !== "all") {
      whereClauses.push("o.order_type = ?");
      params.push(String(order_type).trim().toLowerCase());
    }

    const normalizedOrderCode = String(order_code || "")
      .replace(/^#/, "")
      .replace(/[^0-9]/g, "")
      .trim();

    if (normalizedOrderCode) {
      whereClauses.push("CAST(o.id AS CHAR) LIKE ?");
      params.push(`%${normalizedOrderCode}%`);
    }

    const normalizedStartDate = String(start_date || "").trim();
    const normalizedEndDate = String(end_date || "").trim();

    if (normalizedStartDate) {
      whereClauses.push("DATE(o.created_at) >= ?");
      params.push(normalizedStartDate);
    }

    if (normalizedEndDate) {
      whereClauses.push("DATE(o.created_at) <= ?");
      params.push(normalizedEndDate);
    }

    return {
      whereSql: whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "",
      params,
    };
  }
// Hàm lấy danh sách đơn hàng với phân trang và bộ lọc cho admin
  async findAllOrders({
    limit = 20,
    offset = 0,
    status = "all",
    order_type = "all",
    order_code = "",
    start_date = "",
    end_date = "",
  } = {}) {
    let query = `
      SELECT 
        o.id,
        o.customer_type,
        o.order_type,
        o.status,
        o.cancel_reason,
        o.cancel_user_id,
        o.cancel_role,
        o.cancelled_at,
        o.is_paid,
        o.total_amount,
        o.amount,
        o.discount_amount,
        o.delivery_fee,
        o.used_points,
        o.created_at,
        o.paid_at,
        t.code as table_code,
        odi.receiver_name,
        odi.receiver_phone,
        odi.receiver_email,
        odi.address,
        odi.note,
        op.payment_method,
        op.payment_status
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      LEFT JOIN order_delivery_info odi ON odi.order_id = o.id
      LEFT JOIN order_payments op ON op.order_id = o.id
    `;
    const { whereSql, params } = this.buildAdminOrderFilters({
      status,
      order_type,
      order_code,
      start_date,
      end_date,
    });

    query += whereSql;

    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    return rows;
  }
// Hàm đếm tổng số đơn hàng (không phân trang) theo các bộ lọc để phục vụ phân trang ở frontend( admin)
  async countAllOrders({
    status = "all",
    order_type = "all",
    order_code = "",
    start_date = "",
    end_date = "",
  } = {}) {
    let query = "SELECT COUNT(*) as count FROM orders o";
    const { whereSql, params } = this.buildAdminOrderFilters({
      status,
      order_type,
      order_code,
      start_date,
      end_date,
    });

    query += whereSql;

    const [rows] = await db.query(query, params);
    return rows[0].count;
  }

  async cancelExpiredPendingPayosOrders({ timeoutMinutes = 5 } = {}) {
    const safeTimeoutMinutes = Math.max(1, Number(timeoutMinutes) || 5);

    const [result] = await db.query(
      `
      UPDATE orders o
      JOIN order_payments op ON op.order_id = o.id
      SET o.status = 'cancelled',
          o.is_paid = 0,
          op.payment_status = 'cancelled'
      WHERE o.status = 'pending'
        AND o.is_paid = 0
        AND op.payment_method = 'payos'
        AND op.payment_status = 'pending'
        AND o.created_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      `,
      [safeTimeoutMinutes]
    );

    return Number(result?.affectedRows || 0);
  }

  async updateOrderStaffAndSession(orderId, staffId, cashSessionId) {
    const [result] = await db.query(
      `
      UPDATE orders 
      SET staff_id = ?,
          cash_session_id = ?
      WHERE id = ?
      `,
      [staffId || null, cashSessionId || null, orderId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new OrderRepository();
