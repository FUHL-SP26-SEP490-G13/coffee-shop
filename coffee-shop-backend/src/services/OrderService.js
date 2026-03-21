const OrderRepository = require("../repositories/OrderRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class OrderService {
  createBadRequestError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  }

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
      discount_code,
      items,
    } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ErrorResponse(400, "Giỏ hàng trống");
    }

    if (!["delivery", "takeaway", "dine-in"].includes(order_type)) {
      throw new ErrorResponse(400, "Loại đơn hàng không hợp lệ");
    }

    if (order_type === "dine-in" && !payload.table_id) {
      throw new ErrorResponse(400, "Vui lòng chọn bàn cho đơn hàng tại quán");
    }

    if (!["cash", "payos"].includes(payment_method)) {
      throw new ErrorResponse(400, "Phương thức thanh toán không hợp lệ");
    }

    if (order_type !== "dine-in" && (!receiver_name || !receiver_phone)) {
      throw new ErrorResponse(400, "Vui lòng nhập tên và số điện thoại người nhận");
    }

    const connection = await OrderRepository.getConnection();

    try {
      await connection.beginTransaction();

      let activeOrderId = null;
      let existingOrderAmount = 0;

      if (order_type === "dine-in") {
        const activeOrder = await OrderRepository.findActiveOrderByTableId(
          connection,
          payload.table_id
        );
        if (activeOrder) {
          activeOrderId = activeOrder.id;
          existingOrderAmount = Number(activeOrder.total_amount);
        }
      }

      let totalAmount = 0;
      const normalizedItems = [];

      for (const item of items) {
        console.log("ITEM RECEIVED:", item);
        console.log("ITEM TOPPINGS:", item.toppings);
        const quantity = Number(item.quantity);
        const toppings = Array.isArray(item.toppings) ? item.toppings : [];

        if (!item.product_size_id || quantity <= 0) {
          throw new ErrorResponse(400, "Dữ liệu sản phẩm trong giỏ hàng không hợp lệ");
        }

        const productSize = await OrderRepository.findProductSizeById(
          connection,
          item.product_size_id
        );

        if (!productSize) {
          throw new ErrorResponse(400, "Sản phẩm không tồn tại");
        }

        if (productSize.status !== "available") {
          throw new ErrorResponse(400, `Sản phẩm "${productSize.name}" hiện không khả dụng`);
        }

        const basePrice = Number(productSize.price);
        let toppingsTotal = 0;
        const normalizedToppings = [];

        for (const toppingItem of toppings) {
          const toppingId = Number(toppingItem.topping_id);
          const toppingQty = Math.max(1, Number(toppingItem.quantity) || 1);

          if (!toppingId) {
            throw new ErrorResponse(400, "Topping không hợp lệ");
          }

          const topping = await OrderRepository.findToppingById(
            connection,
            toppingId
          );

          if (!topping) {
            throw new ErrorResponse(400, "Topping không tồn tại");
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

      let discountAmount = 0;
      let discountCodeApplied = null;
      let discountIdApplied = null;

      const normalizedDiscountCode = String(discount_code || "").trim();
      if (normalizedDiscountCode) {
        const discount = await OrderRepository.findDiscountByCodeForCheckout(
          connection,
          normalizedDiscountCode
        );

        if (!discount) {
          throw new ErrorResponse(400, "Mã giảm giá không tồn tại");
        }

        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if (validFrom && now < validFrom) {
          throw this.createBadRequestError("Mã giảm giá chưa đến thời gian sử dụng");
        }

        if (validUntil && now > validUntil) {
          throw this.createBadRequestError("Mã giảm giá đã hết hạn");
        }

        const usageLimit =
          discount.usage_limit === null || discount.usage_limit === undefined
            ? null
            : Number(discount.usage_limit);
        const usedCount = Number(discount.used_count || 0);

        if (usageLimit !== null && usedCount >= usageLimit) {
          throw this.createBadRequestError("Mã giảm giá đã hết lượt sử dụng");
        }

        const minOrderAmount = Number(discount.min_order_amount || 0);
        if (totalAmount < minOrderAmount) {
          throw this.createBadRequestError(
            `Đơn tối thiểu ${minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng mã này`
          );
        }

        const percentage = Number(discount.percentage || 0);
        let calculatedDiscount = Math.round((totalAmount * percentage) / 100);
        const maxDiscount =
          discount.max_discount_amount === null ||
          discount.max_discount_amount === undefined
            ? null
            : Number(discount.max_discount_amount);

        if (maxDiscount !== null) {
          calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
        }

        discountAmount = Math.min(totalAmount, Math.max(0, calculatedDiscount));
        discountCodeApplied = discount.code;
        discountIdApplied = discount.id;
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);

      const userId = user?.id || null;

      let orderId = activeOrderId;
      if (!orderId) {
        orderId = await OrderRepository.createOrder(connection, {
          user_id: userId,
          created_by: userId,
          customer_type: user ? "registered" : "guest",
          order_type,
          table_id: order_type === "dine-in" ? payload.table_id : null,
          total_amount: finalAmount,
        });

        if (order_type === "dine-in") {
          await connection.query(
            "UPDATE tables SET status = 'occupied' WHERE id = ?",
            [payload.table_id]
          );
        }
      } else {
        const newTotal = existingOrderAmount + finalAmount;
        await OrderRepository.updateOrderTotalAmount(connection, orderId, newTotal);
      }

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

      if (order_type !== "dine-in" || (note && note.trim())) {
        const [existingInfo] = await connection.query(
          "SELECT id FROM order_delivery_info WHERE order_id = ?",
          [orderId]
        );

        if (existingInfo.length > 0) {
          if (note && note.trim()) {
            await connection.query(
              "UPDATE order_delivery_info SET note = ? WHERE order_id = ?",
              [note.trim(), orderId]
            );
          }
        } else {
          await OrderRepository.createOrderDeliveryInfo(connection, {
            order_id: orderId,
            receiver_name: receiver_name ? receiver_name.trim() : "",
            receiver_phone: receiver_phone ? receiver_phone.trim() : "",
            receiver_email: receiver_email?.trim() || null,
            address: address?.trim() || null,
            note: note?.trim() || null,
          });
        }
      }

      await OrderRepository.createOrderPayment(connection, {
        order_id: orderId,
        payment_method,
        payment_status: "pending",
        amount: finalAmount,
      });

      if (discountIdApplied) {
        await OrderRepository.incrementDiscountUsedCount(connection, discountIdApplied);
      }

      await connection.commit();

      return {
        order_id: orderId,
        subtotal_amount: totalAmount,
        discount_amount: discountAmount,
        discount_code: discountCodeApplied,
        total_amount: finalAmount,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async validateDiscount(code, orderAmount) {
    const normalizedCode = String(code || "").trim();

    if (!normalizedCode) {
      throw this.createBadRequestError("Vui lòng nhập mã giảm giá");
    }

    const subtotal = Number(orderAmount || 0);
    if (Number.isNaN(subtotal) || subtotal < 0) {
      throw this.createBadRequestError("Giá trị đơn hàng không hợp lệ");
    }

    const connection = await OrderRepository.getConnection();
    try {
      const discount = await OrderRepository.findDiscountByCodeForCheckout(
        connection,
        normalizedCode
      );

      if (!discount) {
        throw this.createBadRequestError("Mã giảm giá không tồn tại");
      }

      const now = new Date();
      const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
      const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

      if (validFrom && now < validFrom) {
        throw this.createBadRequestError("Mã giảm giá chưa đến thời gian sử dụng");
      }

      if (validUntil && now > validUntil) {
        throw this.createBadRequestError("Mã giảm giá đã hết hạn");
      }

      const usageLimit =
        discount.usage_limit === null || discount.usage_limit === undefined
          ? null
          : Number(discount.usage_limit);
      const usedCount = Number(discount.used_count || 0);

      if (usageLimit !== null && usedCount >= usageLimit) {
        throw this.createBadRequestError("Mã giảm giá đã hết lượt sử dụng");
      }

      const minOrderAmount = Number(discount.min_order_amount || 0);
      if (subtotal < minOrderAmount) {
        throw this.createBadRequestError(
          `Đơn tối thiểu ${minOrderAmount.toLocaleString("vi-VN")}đ để áp dụng mã này`
        );
      }

      const percentage = Number(discount.percentage || 0);
      let discountAmount = Math.round((subtotal * percentage) / 100);
      const maxDiscount =
        discount.max_discount_amount === null ||
        discount.max_discount_amount === undefined
          ? null
          : Number(discount.max_discount_amount);

      if (maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }

      discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

      return {
        code: discount.code,
        percentage,
        min_order_amount: minOrderAmount,
        max_discount_amount: maxDiscount,
        discount_amount: discountAmount,
        final_amount: Math.max(0, subtotal - discountAmount),
      };
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
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    const items = await OrderRepository.findOrderItems(orderId);

    return {
      ...order,
      items,
    };
  }

  async savePayosReturn({ orderCode, payosId, status }) {
    if (!orderCode) throw new ErrorResponse(400, "Thiếu orderCode");

    const isPaid = status === "PAID";
    const paymentStatus = isPaid
      ? "paid"
      : status === "CANCELLED"
      ? "cancelled"
      : "pending";

    await OrderRepository.updatePaymentByOrderCode(orderCode, {
      transaction_id: payosId || null,
      payment_status: paymentStatus,
    });

    if (isPaid) {
      await OrderRepository.updateOrderPaidStatus(orderCode, true);
    }

    return { saved: true };
  }

  async getAllOrders() {
    const orders = await OrderRepository.findAllOrders();
    for (const order of orders) {
      const items = await OrderRepository.findOrderItems(order.id);
      order.items = items.map(item => ({
        ...item,
        product: { name: item.name }
      }));
    }
    return orders;
  }
}

module.exports = new OrderService();
