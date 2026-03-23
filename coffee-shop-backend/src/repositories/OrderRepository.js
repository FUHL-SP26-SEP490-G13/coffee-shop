const db = require("../config/database");

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
        total_amount
      )
      VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)
      `,
      [
        data.user_id,
        data.created_by,
        data.customer_type,
        data.order_type,
        data.table_id || null,
        data.total_amount,
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
        note
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.order_id,
        data.receiver_name,
        data.receiver_phone,
        data.receiver_email,
        data.address,
        data.note,
      ]
    );
  }

  async createOrderPayment(connection, data) {
    await connection.query(
      `
      INSERT INTO order_payments (
        order_id,
        payment_method,
        payment_status,
        amount,
        transaction_id,
        paid_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.order_id,
        data.payment_method,
        data.payment_status || "pending",
        data.amount,
        data.transaction_id || null,
        data.payment_status === "paid" ? new Date() : null,
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
    // order_payments.order_id = orderCode because we use order_id as the PayOS orderCode
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

  async updatePaymentStatusByOrderId(orderId, paymentStatus) {
    await db.query(
      `
      UPDATE order_payments
      SET payment_status = ?
      WHERE order_id = ?
      `,
      [paymentStatus, orderId]
    );
  }

  async cancelOrderByUser(orderId, userId) {
    const [result] = await db.query(
      `
      UPDATE orders
      SET status = 'cancelled'
      WHERE id = ?
        AND user_id = ?
        AND status IN ('pending', 'preparing')
      `,
      [orderId, userId]
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
        is_paid,
        total_amount,
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
        o.is_paid,
        o.total_amount,
        o.created_at,
        o.paid_at,
        odi.receiver_name,
        odi.receiver_phone,
        odi.receiver_email,
        odi.address,
        odi.note,
        op.payment_method,
        op.payment_status,
        op.amount
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
        o.order_type,
        o.status,
        o.is_paid,
        o.created_at,
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
        o.is_paid,
        o.total_amount,
        o.created_at,
        o.paid_at,
        odi.receiver_name,
        odi.receiver_phone,
        odi.receiver_email,
        odi.address,
        odi.note,
        op.payment_method,
        op.payment_status,
        op.amount
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
      SELECT id, total_amount
      FROM orders
      WHERE table_id = ? AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [tableId]
    );

    return rows[0] || null;
  }

  async updateOrderTotalAmount(connection, orderId, finalAmount) {
    await connection.query(
      `
      UPDATE orders
      SET total_amount = ?
      WHERE id = ?
      `,
      [finalAmount, orderId]
    );
  }

  async findAllOrders({ limit = 20, offset = 0, status = "all" } = {}) {
    let query = `
      SELECT 
        o.id,
        o.customer_type,
        o.order_type,
        o.status,
        o.is_paid,
        o.total_amount,
        o.created_at,
        o.paid_at,
        t.code as table_code
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
    `;
    const params = [];

    if (status && status !== "all") {
      query += " WHERE o.status = ?";
      params.push(status);
    }

    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    return rows;
  }

  async countAllOrders({ status = "all" } = {}) {
    let query = "SELECT COUNT(*) as count FROM orders o";
    const params = [];

    if (status && status !== "all") {
      query += " WHERE o.status = ?";
      params.push(status);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count;
  }
}

module.exports = new OrderRepository();
