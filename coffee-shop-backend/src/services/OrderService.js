const OrderRepository = require("../repositories/OrderRepository");

class OrderService {
  async checkout(payload, user) {
    const {
      order_type,
      payment_method,
      receiver_name,
      receiver_phone,
      receiver_email,
      address,
      note,
      items,
    } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    if (!["delivery", "takeaway"].includes(order_type)) {
      throw new Error("Loại đơn hàng không hợp lệ");
    }

    if (!["cash", "card", "momo", "banking"].includes(payment_method)) {
      throw new Error("Phương thức thanh toán không hợp lệ");
    }

    if (!receiver_name || !receiver_phone) {
      throw new Error("Vui lòng nhập tên và số điện thoại người nhận");
    }

    const connection = await OrderRepository.getConnection();

    try {
      await connection.beginTransaction();

      let totalAmount = 0;
      const normalizedItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (!item.product_size_id || quantity <= 0) {
          throw new Error("Dữ liệu sản phẩm trong giỏ hàng không hợp lệ");
        }

        const productSize = await OrderRepository.findProductSizeById(
          connection,
          item.product_size_id
        );

        if (!productSize) {
          throw new Error("Sản phẩm không tồn tại");
        }

        if (productSize.status !== "available") {
          throw new Error(`Sản phẩm "${productSize.name}" hiện không khả dụng`);
        }

        const price = Number(productSize.price);
        totalAmount += price * quantity;

        normalizedItems.push({
          product_size_id: productSize.id,
          quantity,
          price,
        });
      }

      const userId = user?.id || null;

      const orderId = await OrderRepository.createOrder(connection, {
        user_id: userId,
        created_by: userId,
        customer_type: user ? "registered" : "guest",
        order_type,
        total_amount: totalAmount,
      });

      for (const item of normalizedItems) {
        await OrderRepository.createOrderDetail(connection, {
          order_id: orderId,
          product_size_id: item.product_size_id,
          quantity: item.quantity,
          price: item.price,
        });
      }

      await OrderRepository.createOrderDeliveryInfo(connection, {
        order_id: orderId,
        receiver_name: receiver_name.trim(),
        receiver_phone: receiver_phone.trim(),
        receiver_email: receiver_email?.trim() || null,
        address: address?.trim() || null,
        note: note?.trim() || null,
      });

      await OrderRepository.createOrderPayment(connection, {
        order_id: orderId,
        payment_method,
        amount: totalAmount,
      });

      await connection.commit();

      return {
        order_id: orderId,
        total_amount: totalAmount,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getOrdersByUser(userId) {
    return await OrderRepository.findOrdersByUser(userId);
  }

  async getOrderDetailByUser(orderId, userId) {
    const order = await OrderRepository.findOrderByIdAndUser(orderId, userId);

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    const items = await OrderRepository.findOrderItems(orderId);

    return {
      ...order,
      items,
    };
  }
}

module.exports = new OrderService();
