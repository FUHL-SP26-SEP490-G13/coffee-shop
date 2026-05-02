const OrderRepository = require("../repositories/OrderRepository");
const LoyaltyService = require("./LoyaltyService");
const ErrorResponse = require("../utils/ErrorResponse");
const TableService = require("./TableService");

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
      cash_received,
      receiver_name,
      receiver_phone,
      receiver_email,
      address,
      order_note,
      delivery_note,
      discount_code,
      used_points,
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

    const connection = await OrderRepository.getConnection();

    try {
      await connection.beginTransaction();

      const userId = user?.id || null;
      const normalizedUsedPoints = Math.max(0, Number(used_points) || 0);

      if (!Number.isInteger(normalizedUsedPoints) || normalizedUsedPoints < 0) {
        throw new ErrorResponse(400, "Điểm sử dụng không hợp lệ");
      }

      if (normalizedUsedPoints > 0 && !userId) {
        throw new ErrorResponse(401, "Bạn cần đăng nhập để sử dụng điểm loyalty");
      }

      let sessionId = null;
      if (order_type === "dine-in") {
        const [tableRows] = await connection.query(
          "SELECT current_session_id FROM tables WHERE id = ?",
          [payload.table_id]
        );
        if (tableRows.length > 0) {
          sessionId = tableRows[0].current_session_id;
          if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          }
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
      let loyaltyDiscountAmount = 0;

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

      const amountAfterVoucher = Math.max(0, totalAmount - discountAmount);

      if (normalizedUsedPoints > 0) {
        loyaltyDiscountAmount = await LoyaltyService.getRedeemDiscountForCheckout(
          connection,
          {
            userId,
            usedPoints: normalizedUsedPoints,
            orderAmount: amountAfterVoucher,
          }
        );
      }

      const finalAmount = Math.max(0, amountAfterVoucher - loyaltyDiscountAmount);
      const totalDiscountAmount = Math.max(
        0,
        discountAmount + loyaltyDiscountAmount
      );

      const normalizedCashReceived =
        payment_method === "cash"
          ? cash_received === undefined || cash_received === null || cash_received === ""
            ? finalAmount
            : Number(cash_received)
          : 0;

      if (
        payment_method === "cash" &&
        (!Number.isFinite(normalizedCashReceived) || normalizedCashReceived < finalAmount)
      ) {
        throw new ErrorResponse(400, "Tiền khách đưa không đủ");
      }

      const normalizedChangeAmount =
        payment_method === "cash"
          ? Math.max(0, normalizedCashReceived - finalAmount)
          : 0;

      const orderId = await OrderRepository.createOrder(connection, {
        user_id: null,
        // Đơn tại quán và mang về sẽ bắt đầu ở trạng thái "preparing" để nhân viên bếp 
        // có thể thấy và xử lý ngay, không phải chờ khách thanh toán xong mới hiển thị
        status: (order_type === "dine-in" || order_type === "takeaway") ? "preparing" : "pending",
        customer_type: "guest",
        order_type,
        table_id: order_type === "dine-in" ? payload.table_id : null,
        amount: totalAmount,
        discount_amount: totalDiscountAmount,
        total_amount: finalAmount,
        used_points: normalizedUsedPoints,
        session_id: sessionId,
        note: order_note?.trim() || null,
        staff_id: userId,
      });

      if (order_type === "dine-in") {
        await connection.query(
          "UPDATE tables SET status = 'occupied', current_session_id = ? WHERE id = ?",
          [sessionId, payload.table_id]
        );
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

      const normalizedReceiverName = receiver_name ? receiver_name.trim() : "";
      const normalizedReceiverPhone = receiver_phone ? receiver_phone.trim() : "";
      const normalizedReceiverEmail = receiver_email?.trim() || null;
      const normalizedAddress = address?.trim() || null;
      const normalizedOrderNote = order_note?.trim() || null;
      const normalizedDeliveryNote = delivery_note?.trim() || null;

      const hasReceiverInfo = Boolean(
        normalizedReceiverName ||
        normalizedReceiverPhone ||
        normalizedReceiverEmail ||
        normalizedAddress
      );

      if (order_type !== "dine-in" || hasReceiverInfo || normalizedOrderNote) {
        const [existingInfo] = await connection.query(
          "SELECT id FROM order_delivery_info WHERE order_id = ?",
          [orderId]
        );

        if (existingInfo.length > 0) {
          await connection.query(
            `UPDATE order_delivery_info
             SET receiver_name = ?, receiver_phone = ?, receiver_email = ?, address = ?, note = ?
             WHERE order_id = ?`,
            [
              normalizedReceiverName,
              normalizedReceiverPhone,
              normalizedReceiverEmail,
              normalizedAddress,
              normalizedDeliveryNote,
              orderId,
            ]
          );
        } else {
          await OrderRepository.createOrderDeliveryInfo(connection, {
            order_id: orderId,
            receiver_name: normalizedReceiverName,
            receiver_phone: normalizedReceiverPhone,
            receiver_email: normalizedReceiverEmail,
            address: normalizedAddress,
            note: normalizedDeliveryNote,
          });
        }
      }

      await OrderRepository.createOrderPayment(connection, {
        order_id: orderId,
        payment_method,
        payment_status: payment_method === "cash" ? "paid" : "pending",
        amount: finalAmount,
        paid_amount: payment_method === "cash" ? finalAmount : 0,
        cash_received: payment_method === "cash" ? normalizedCashReceived : 0,
        change_amount: normalizedChangeAmount,
      });

      if (payment_method === "cash") {
        await connection.query(
          "UPDATE orders SET is_paid = 1, paid_at = NOW() WHERE id = ?",
          [orderId]
        );
      }

      if (discountIdApplied) {
        await OrderRepository.incrementDiscountUsedCount(connection, discountIdApplied);
      }

      if (normalizedUsedPoints > 0) {
        await LoyaltyService.applyRedeemForOrder(connection, {
          userId,
          orderId,
          usedPoints: normalizedUsedPoints,
        });
      }

      await connection.commit();

      return {
        order_id: orderId,
        subtotal_amount: totalAmount,
        discount_amount: discountAmount,
        loyalty_discount_amount: loyaltyDiscountAmount,
        discount_code: discountCodeApplied,
        used_points: normalizedUsedPoints,
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

  async getOrderDetail(orderId) {
    const order = await OrderRepository.findOrderDetailForStaff(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    const items = await OrderRepository.findOrderItems(orderId);

    return {
      ...order,
      items,
    };
  }

  async savePayosReturn({ orderCode, payosId, status, cancel }) {
    if (!orderCode) throw new ErrorResponse(400, "Thiếu orderCode");

    const order = await OrderRepository.findOrderById(orderCode);
    const currentOrderStatus = String(order?.status || "").toLowerCase();

    const normalizedStatus = String(status || "").toUpperCase();
    const isCancelled =
      currentOrderStatus === "cancelled" ||
      normalizedStatus === "CANCELLED" ||
      String(cancel || "").toLowerCase() === "true" ||
      String(cancel || "") === "1";
    const isPaid = !isCancelled && normalizedStatus === "PAID";
    const paymentStatus = isCancelled ? "cancelled" : isPaid ? "paid" : "pending";

    await OrderRepository.updatePaymentByOrderCode(orderCode, {
      transaction_id: payosId || null,
      payment_status: paymentStatus,
    });

    if (isCancelled) {
      await OrderRepository.updateOrderStatus(orderCode, "cancelled");
      await OrderRepository.updateOrderPaidStatus(orderCode, false);
      await LoyaltyService.syncOrderLoyaltyByOrderId(orderCode);
    } else if (isPaid) {
      await OrderRepository.updateOrderPaidStatus(orderCode, true);
    }

    if (
      order &&
      order.order_type === "dine-in" &&
      order.table_id &&
      order.session_id
    ) {
      const connection = await OrderRepository.getConnection();
      try {
        await TableService.checkAndResetTableStatus(
          connection,
          order.table_id,
          order.session_id
        );
      } finally {
        connection.release();
      }
    }

    return { saved: true };
  }

  async updateOrderItems(orderId, items) {
    const connection = await OrderRepository.getConnection();
    try {
      await connection.beginTransaction();

      // Verify the order exists, is unpaid, and is a dine-in order
      const [orderRows] = await connection.query(
        `SELECT id, is_paid, order_type FROM orders WHERE id = ? LIMIT 1`,
        [orderId]
      );
      if (orderRows.length === 0) {
        throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
      }
      const order = orderRows[0];
      if (Number(order.is_paid) === 1) {
        throw new ErrorResponse(400, 'Không thể sửa đơn hàng đã thanh toán');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new ErrorResponse(400, 'Giỏ hàng trống');
      }

      let totalAmount = 0;
      const normalizedItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity);
        const toppings = Array.isArray(item.toppings) ? item.toppings : [];

        if (!item.product_size_id || quantity <= 0) {
          throw new ErrorResponse(400, 'Dữ liệu sản phẩm không hợp lệ');
        }

        const productSize = await OrderRepository.findProductSizeById(connection, item.product_size_id);
        if (!productSize) throw new ErrorResponse(400, 'Sản phẩm không tồn tại');
        if (productSize.status !== 'available') {
          throw new ErrorResponse(400, `Sản phẩm "${productSize.name}" hiện không khả dụng`);
        }

        let toppingsTotal = 0;
        const normalizedToppings = [];
        for (const toppingItem of toppings) {
          const toppingId = Number(toppingItem.topping_id);
          const toppingQty = Math.max(1, Number(toppingItem.quantity) || 1);
          if (!toppingId) throw new ErrorResponse(400, 'Topping không hợp lệ');
          const topping = await OrderRepository.findToppingById(connection, toppingId);
          if (!topping) throw new ErrorResponse(400, 'Topping không tồn tại');
          const toppingPrice = Number(topping.price || 0);
          toppingsTotal += toppingPrice * toppingQty;
          normalizedToppings.push({ topping_id: topping.id, quantity: toppingQty, price: toppingPrice });
        }

        const unitPrice = Number(productSize.price) + toppingsTotal;
        totalAmount += unitPrice * quantity;
        normalizedItems.push({ product_size_id: productSize.id, quantity, price: unitPrice, toppings: normalizedToppings });
      }

      // Delete existing order details (and their toppings via cascade or manual)
      const [existingDetails] = await connection.query(
        'SELECT id FROM order_details WHERE order_id = ?',
        [orderId]
      );
      for (const detail of existingDetails) {
        await connection.query('DELETE FROM order_detail_toppings WHERE order_detail_id = ?', [detail.id]);
      }
      await connection.query('DELETE FROM order_details WHERE order_id = ?', [orderId]);

      // Insert new items
      for (const item of normalizedItems) {
        const orderDetailId = await OrderRepository.createOrderDetail(connection, {
          order_id: orderId,
          product_size_id: item.product_size_id,
          quantity: item.quantity,
          price: item.price,
        });
        for (const topping of item.toppings) {
          await OrderRepository.createOrderDetailTopping(connection, {
            order_detail_id: orderDetailId,
            topping_id: topping.topping_id,
            quantity: topping.quantity,
            price: topping.price,
          });
        }
      }

      // Keep order amount fields aligned after staff edits unpaid items.
      await connection.query(
        'UPDATE orders SET total_amount = ?, amount = ?, discount_amount = 0 WHERE id = ?',
        [totalAmount, totalAmount, orderId]
      );
      await connection.query('UPDATE order_payments SET amount = ? WHERE order_id = ?', [totalAmount, orderId]);

      await connection.commit();
      return { order_id: orderId, total_amount: totalAmount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
//admin
  async getAllOrders({
    page = 1,
    limit = 20,
    status = "all",
    order_type = "all",
    order_code = "",
    start_date = "",
    end_date = "",
  } = {}) {
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const normalizedStartDate = String(start_date || "").trim();
    const normalizedEndDate = String(end_date || "").trim();

    if (normalizedStartDate && normalizedEndDate && normalizedStartDate > normalizedEndDate) {
      throw new ErrorResponse(400, "Khoảng ngày không hợp lệ");
    }
// Nếu start_date hoặc end_date không hợp lệ, ta có thể chọn cách xử lý là bỏ qua filter ngày thay vì trả lỗi
    const [orders, totalCount] = await Promise.all([
      OrderRepository.findAllOrders({
        limit,
        offset,
        status,
        order_type,
        order_code,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
      }),
      OrderRepository.countAllOrders({
        status,
        order_type,
        order_code,
        start_date: normalizedStartDate,
        end_date: normalizedEndDate,
      })
    ]);

    for (const order of orders) {
      const items = await OrderRepository.findOrderItems(order.id);
      order.items = items.map(item => ({
        ...item,
        product: { name: item.name }
      }));
    }

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return {
      orders,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  async getActiveOrderForTable(tableId) {
    const connection = await OrderRepository.getConnection();
    try {
      const [tableRows] = await connection.query("SELECT current_session_id FROM tables WHERE id = ?", [tableId]);
      if (tableRows.length === 0 || !tableRows[0].current_session_id) {
        return null;
      }

      const sessionId = tableRows[0].current_session_id;

      const [rows] = await connection.query(
        `
        SELECT
          o.id,
          o.created_at,
          o.total_amount,
          o.is_paid,
          o.status AS order_status,
          COALESCE(op.payment_status, 'pending') AS payment_status
        FROM orders o
        LEFT JOIN order_payments op ON op.order_id = o.id
        WHERE o.table_id = ?
          AND o.session_id = ?
          AND o.status NOT IN ('cancelled')
          AND o.total_amount > 0
        ORDER BY o.created_at ASC
        `,
        [tableId, sessionId]
      );

      if (rows.length === 0) {
        return null;
      }

      let combinedTotal = 0;
      let debtAmount = 0;
      let unpaidOrdersCount = 0;
      let allItems = [];
      const splitBills = [];
      const unpaidOrders = rows.filter((order) => {
        const paidFlag = Number(order.is_paid || 0) === 1;
        const paymentStatus = String(order.payment_status || '').toLowerCase();
        return !(paidFlag && paymentStatus === 'paid');
      });
      // Pick a non-cancelled order as representative
      const representativeOrderId = unpaidOrders[0]?.id || rows[0].id;

      for (const order of rows) {
        const orderTotal = Number(order.total_amount || 0);
        const paidByFlag = Number(order.is_paid || 0) === 1;
        const paidByStatus = String(order.payment_status || '').toLowerCase() === 'paid';
        const isOrderPaid = paidByFlag || paidByStatus;

        combinedTotal += orderTotal;
        if (!isOrderPaid) {
          debtAmount += orderTotal;
          unpaidOrdersCount += 1;
        }

        const orderItems = await OrderRepository.findOrderItems(order.id);
        allItems = allItems.concat(orderItems);
        splitBills.push({
          id: Number(order.id),
          created_at: order.created_at,
          total_amount: orderTotal,
          is_paid: paidByFlag ? 1 : 0,
          payment_status: order.payment_status || 'pending',
          items: orderItems,
        });
      }

      const orderData = await OrderRepository.findOrderDetailForStaff(representativeOrderId);
      if (!orderData) return null;

      return {
        ...orderData,
        total_amount: combinedTotal,
        debt_amount: debtAmount,
        unpaid_orders_count: unpaidOrdersCount,
        split_bills: splitBills,
        items: allItems,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new OrderService();
