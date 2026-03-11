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

  async createOrder(connection, data) {
    const [result] = await connection.query(
      `
      INSERT INTO orders (
        user_id,
        created_by,
        customer_type,
        order_type,
        status,
        is_paid,
        total_amount
      )
      VALUES (?, ?, ?, ?, 'pending', 0, ?)
      `,
      [
        data.user_id,
        data.created_by,
        data.customer_type,
        data.order_type,
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
        amount
      )
      VALUES (?, ?, 'pending', ?)
      `,
      [data.order_id, data.payment_method, data.amount]
    );
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

  async findOrderItems(orderId) {
    const [rows] = await db.query(
      `
      SELECT 
        od.id,
        od.product_size_id,
        od.quantity,
        od.price,
        ps.size,
        p.name
      FROM order_details od
      JOIN product_sizes ps ON ps.id = od.product_size_id
      JOIN products p ON p.id = ps.product_id
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
}

module.exports = new OrderRepository();
