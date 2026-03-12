const OrderRepository = require("../repositories/OrderRepository");

class OrderService {
  async checkout(payload, user) {
    console.log("CHECKOUT BODY:", JSON.stringify(payload, null, 2));
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

    if (!["cash", "payos"].includes(payment_method)) {
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
        console.log("ITEM RECEIVED:", item);
        console.log("ITEM TOPPINGS:", item.toppings);
        const quantity = Number(item.quantity);
        const toppings = Array.isArray(item.toppings) ? item.toppings : [];

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

        const basePrice = Number(productSize.price);
        let toppingsTotal = 0;
        const normalizedToppings = [];

        for (const toppingItem of toppings) {
          const toppingId = Number(toppingItem.topping_id);
          const toppingQty = Math.max(1, Number(toppingItem.quantity) || 1);

          if (!toppingId) {
            throw new Error("Topping không hợp lệ");
          }

          const topping = await OrderRepository.findToppingById(
            connection,
            toppingId
          );

          if (!topping) {
            throw new Error("Topping không tồn tại");
          }

          const toppingPrice = Number(topping.price || 0);
          toppingsTotal += toppingPrice * toppingQty;

          normalizedToppings.push({
            topping_id: topping.id,
            quantity: toppingQty,
            price: toppingPrice,
            name: topping.name,
          });
        }

        const unitPrice = basePrice + toppingsTotal;
        totalAmount += unitPrice * quantity;

        normalizedItems.push({
          product_size_id: productSize.id,
          quantity,
          price: unitPrice,
          toppings: normalizedToppings,
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
        const orderDetailId = await OrderRepository.createOrderDetail(
          connection,
          {
            order_id: orderId,
            product_size_id: item.product_size_id,
            quantity: item.quantity,
            price: item.price,
          }
        );

        for (const topping of item.toppings) {
          console.log("INSERT TOPPING:", topping);
          await OrderRepository.createOrderDetailTopping(connection, {
            order_detail_id: orderDetailId,
            topping_id: topping.topping_id,
            quantity: topping.quantity,
            price: topping.price,
          });
        }
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
        payment_status: payment_method === "payos" ? "paid" : "pending",
        amount: totalAmount,
      });

      if (payment_method === "payos") {
        await OrderRepository.markOrderAsPaid(connection, orderId);
      }

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
