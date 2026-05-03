const pool = require('../config/database');

class TakeawayRepository {
  async getConnection() {
    return pool.getConnection();
  }

  async findProductSizeById(connection, id) {
    const [[row]] = await connection.query(
      `SELECT ps.id, ps.price, ps.size, ps.is_deleted,
              p.name, p.status, p.is_deleted AS product_deleted
       FROM product_sizes ps
       INNER JOIN products p ON ps.product_id = p.id
       WHERE ps.id = ?`,
      [id],
    );
    return row || null;
  }

  async findToppingById(connection, id) {
    const [[row]] = await connection.query(
      `SELECT id, name, price, is_deleted 
       FROM toppings WHERE id = ? AND is_deleted = 0`,
      [id],
    );
    return row || null;
  }

  async findDiscountByCode(connection, code) {
    const [[row]] = await connection.query(
      `SELECT * FROM discount WHERE code = ? AND deleted_at IS NULL`,
      [code],
    );
    return row || null;
  }

  async createOrder(
    connection,
    {
      user_id,
      order_type,
      total_amount,
      amount,
      discount_amount,
      discount_id,
      cash_session_id,
      staff_id,
    },
  ) {
    const [result] = await connection.query(
      `INSERT INTO orders 
         (user_id, order_type, total_amount, amount, discount_amount, discount_id,
          cash_session_id, staff_id, status, is_paid, customer_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'preparing', 0, 'guest', NOW())`,
      [
        user_id || null,
        order_type,
        total_amount,
        amount,
        discount_amount,
        discount_id || null,
        cash_session_id || null,
        staff_id || null,
      ],
    );
    return result.insertId;
  }

  async createOrderDetail(
    connection,
    { order_id, product_size_id, quantity, price, note },
  ) {
    const [result] = await connection.query(
      `INSERT INTO order_details (order_id, product_size_id, quantity, price, note)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, product_size_id, quantity, price, note || null],
    );
    return result.insertId;
  }

  async createOrderDetailTopping(
    connection,
    { order_detail_id, topping_id, quantity, price },
  ) {
    await connection.query(
      `INSERT INTO order_detail_toppings (order_detail_id, topping_id, quantity, price)
       VALUES (?, ?, ?, ?)`,
      [order_detail_id, topping_id, quantity, price],
    );
  }

  // Tạo payment — cash gộp paid ngay, payos để pending
  async createOrderPayment(
    connection,
    {
      order_id,
      payment_method,
      payment_status,
      amount,
      paid_amount,
      cash_received,
      change_amount,
    },
  ) {
    const isPaid = payment_status === 'paid';
    const normalizedAmount = Number(amount) || 0;

    const normalizedPaidAmount = Number.isFinite(Number(paid_amount))
      ? Number(paid_amount)
      : isPaid
        ? normalizedAmount
        : 0;

    const normalizedCashReceived = Number.isFinite(Number(cash_received))
      ? Number(cash_received)
      : isPaid
        ? normalizedPaidAmount
        : 0;

    const normalizedChangeAmount = Number.isFinite(Number(change_amount))
      ? Math.max(0, Number(change_amount))
      : isPaid
        ? Math.max(0, normalizedCashReceived - normalizedPaidAmount)
        : 0;

    await connection.query(
      `INSERT INTO order_payments 
     (order_id, payment_method, payment_status, amount, paid_amount, cash_received, change_amount, paid_at,created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        order_id,
        payment_method,
        payment_status,
        normalizedAmount,
        normalizedPaidAmount,
        normalizedCashReceived,
        normalizedChangeAmount,
        isPaid ? new Date() : null,
      ],
    );
  }

  // Cash: ghi nhận paid_amount = amount tại thời điểm tạo
  async markOrderPaidCash(connection, orderId, amount, cashReceived = amount) {
    await connection.query(
      `UPDATE orders SET is_paid = 1, paid_at = NOW() WHERE id = ?`,
      [orderId],
    );
    await connection.query(
      `UPDATE order_payments 
       SET payment_status = 'paid', paid_at = NOW(), paid_amount = ?, cash_received = ?, change_amount = GREATEST(? - ?, 0)
       WHERE order_id = ?`,
      [amount, cashReceived, cashReceived, amount, orderId],
    );
  }

  async incrementDiscountUsedCount(connection, discountId) {
    await connection.query(
      `UPDATE discount SET used_count = used_count + 1 WHERE id = ?`,
      [discountId],
    );
  }

  async findOrderById(orderId) {
    const [[row]] = await pool.query(
      `SELECT o.*,
              u.first_name AS staff_first_name, u.last_name AS staff_last_name,
              d.code AS discount_code, d.percentage AS discount_percentage,
              odi.receiver_name,
              odi.receiver_phone,
              odi.receiver_email,
              odi.address,
              odi.note AS delivery_note
       FROM orders o
       LEFT JOIN users u ON o.staff_id = u.id
       LEFT JOIN discount d ON o.discount_id = d.id
       LEFT JOIN order_delivery_info odi ON odi.order_id = o.id
       WHERE o.id = ?`,
      [orderId],
    );
    return row || null;
  }

  async findOrderItems(orderId) {
    const [rows] = await pool.query(
      `SELECT od.id, p.name AS product_name, ps.size,
              od.quantity, od.price, od.note,
              JSON_ARRAYAGG(
                IF(t.id IS NULL, NULL,
                   JSON_OBJECT('topping_id', t.id, 'name', t.name,
                               'quantity', odt.quantity, 'price', odt.price))
              ) AS toppings_raw
       FROM order_details od
       INNER JOIN product_sizes ps ON od.product_size_id = ps.id
       INNER JOIN products p ON ps.product_id = p.id
       LEFT JOIN order_detail_toppings odt ON odt.order_detail_id = od.id
       LEFT JOIN toppings t ON odt.topping_id = t.id
       WHERE od.order_id = ?
       GROUP BY od.id, p.name, ps.size, od.quantity, od.price, od.note`,
      [orderId],
    );
    return rows.map((row) => {
      let toppingsArray = [];
      if (typeof row.toppings_raw === 'string') {
        try {
          toppingsArray = JSON.parse(row.toppings_raw || '[]');
        } catch (e) {
          toppingsArray = [];
        }
      } else if (Array.isArray(row.toppings_raw)) {
        toppingsArray = row.toppings_raw;
      }

      return {
        ...row,
        toppings: toppingsArray.filter(Boolean),
        toppings_raw: undefined,
      };
    });
  }

  async findOrderPayment(orderId) {
    const [[row]] = await pool.query(
      `SELECT * FROM order_payments WHERE order_id = ?`,
      [orderId],
    );
    return row || null;
  }

  async deleteOrderDetails(connection, orderId) {
    await connection.query(`DELETE FROM order_details WHERE order_id = ?`, [
      orderId,
    ]);
  }

  async updateOrderAmounts(
    connection,
    { orderId, total_amount, amount, discount_amount, discount_id },
  ) {
    await connection.query(
      `UPDATE orders SET total_amount = ?, amount = ?, discount_amount = ?, discount_id = ? WHERE id = ?`,
      [total_amount, amount, discount_amount, discount_id || null, orderId],
    );
  }

  // Cập nhật payment sau khi sửa đơn (kể cả đã paid)
  async updatePaymentAfterEdit(connection, { orderId, newAmount }) {
    await connection.query(
      `UPDATE order_payments 
       SET amount = ?
       WHERE order_id = ?`,
      [newAmount, orderId],
    );
  }

  async assignBarista(orderId, baristaId) {
    const [result] = await pool.query(
      `UPDATE orders
       SET staff_id = ?, status = 'preparing'
       WHERE id = ? AND status = 'pending'`,
      [baristaId, orderId],
    );
    return result.affectedRows > 0;
  }

  async completeByBarista(orderId, baristaId) {
    const [result] = await pool.query(
      `UPDATE orders SET status = 'served'
       WHERE id = ? AND status = 'preparing' AND staff_id = ?`,
      [orderId, baristaId],
    );
    return result.affectedRows > 0;
  }

  async markCompleted(orderId) {
    const [result] = await pool.query(
      `UPDATE orders SET status = 'completed' 
       WHERE id = ? AND status = 'preparing'`,
      [orderId],
    );
    return result.affectedRows > 0;
  }

  async cancelOrder(connection, orderId) {
    await connection.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
      [orderId],
    );
  }

  async refundPayment(connection, orderId) {
    await connection.query(
      `UPDATE order_payments SET payment_status = 'refunded' WHERE order_id = ?`,
      [orderId],
    );
  }
}

module.exports = new TakeawayRepository();
