const db = require("../config/database");

class QrOrderRepository {
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
    const [result] = await connection.query(
      `
      INSERT INTO orders (
        user_id,
        created_by,
        customer_type,
        order_type,
        table_id,
        status,
        is_paid,
        total_amount,
        amount,
        discount_amount,
        discount_id
      )
      VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)
      `,
      [
        data.user_id,
        data.created_by,
        data.customer_type,
        data.order_type,
        data.table_id || null,
        data.total_amount,
        Math.max(0, Number(data.amount ?? data.total_amount) || 0),
        Math.max(0, Number(data.discount_amount) || 0),
        data.discount_id || null
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
        price,
        note
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [data.order_id, data.product_size_id, data.quantity, data.price, data.note || null]
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



  async createOrderPayment(connection, data) {
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
}

module.exports = new QrOrderRepository();
