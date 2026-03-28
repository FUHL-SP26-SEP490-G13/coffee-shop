const OrderRepository = require("../repositories/OrderRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class OrderOnlineService {
  createBadRequestError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  }

  normalizePhoneNumber(phoneNumber) {
    const onlyDigits = String(phoneNumber || "").replace(/\D/g, "");
    if (!onlyDigits) return "";

    if (onlyDigits.startsWith("84") && onlyDigits.length >= 11) {
      return `0${onlyDigits.slice(2)}`;
    }

    if (onlyDigits.length === 9) {
      return `0${onlyDigits}`;
    }

    return onlyDigits;
  }

  // Lấy hồ sơ uy tín theo số điện thoại, tạo mới nếu chưa tồn tại
  async getReputationByPhone(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new ErrorResponse(400, "Số điện thoại không hợp lệ");
    }

    const profile = await OrderRepository.findReputationProfileByPhone(normalizedPhone);

    const score = Number(profile?.current_score ?? 50);

    return {
      phone_number: normalizedPhone,
      current_score: score,
      total_orders_completed: Number(profile?.total_orders_completed || 0),
      total_orders_cancelled: Number(profile?.total_orders_cancelled || 0),
      is_frozen: Number(profile?.is_frozen || 0) === 1,
      updated_at: profile?.updated_at || null,
      exists: Boolean(profile),
    };
  }

  async calculateCartAmounts(connection, items) {
    const FlashSaleService = require("../services/FlashSaleService");
    const activeFlashSale = await FlashSaleService.getCurrentActive();

    let totalAmount = 0;
    let regularAmount = 0;
    let flashSaleAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
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

      let basePrice = Number(productSize.price);
      let isFlashSaleApplied = false;
      
      // APPLY FLASH SALE FOR SPECIFIC ITEMS
      if (activeFlashSale && activeFlashSale.product_ids && activeFlashSale.product_ids.includes(productSize.product_id)) {
         const discountRate = Number(activeFlashSale.discount_percent) / 100;
         basePrice = Math.round(basePrice * (1 - discountRate));
         isFlashSaleApplied = true;
      }
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
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;
      
      if (isFlashSaleApplied) {
         flashSaleAmount += itemTotal;
      } else {
         regularAmount += itemTotal;
      }

      normalizedItems.push({
        product_size_id: productSize.id,
        quantity,
        price: unitPrice,
        toppings: normalizedToppings,
      });
    }

    return { totalAmount, regularAmount, flashSaleAmount, normalizedItems };
  }

  // thực hiện checkout
  async checkout(payload, user) {
    console.log("CHECKOUT BODY:", JSON.stringify(payload, null, 2));
    const {
      order_type,
      table_id,
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

      const userId = user?.id || null;

      if (order_type !== "dine-in") {
        const normalizedReceiverPhone = this.normalizePhoneNumber(receiver_phone);

        if (!normalizedReceiverPhone || normalizedReceiverPhone.length < 10) {
          throw new ErrorResponse(400, "Số điện thoại không hợp lệ");
        }

        const pendingUnpaidCount = userId
          ? await OrderRepository.countPendingUnpaidOnlineOrdersByUser(
              connection,
              userId
            )
          : await OrderRepository.countPendingUnpaidOnlineOrdersByPhone(
              connection,
              normalizedReceiverPhone
            );

        if (pendingUnpaidCount >= 2) {
          throw new ErrorResponse(
            400,
            "Bạn đang có 2 đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc hủy bớt đơn trước khi đặt thêm."
          );
        }
      }

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

      const cartTotals = await this.calculateCartAmounts(connection, items);
      let totalAmount = cartTotals.totalAmount;
      let regularAmount = cartTotals.regularAmount;
      const normalizedItems = cartTotals.normalizedItems;

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
        
        if (regularAmount === 0) {
           throw this.createBadRequestError("Không thể áp dụng mã giảm giá vì giỏ hàng của bạn chỉ toàn sản phẩm Flash Sale!");
        }

        if (regularAmount < minOrderAmount) {
          throw this.createBadRequestError(
             `Voucher chỉ áp dụng cho sản phẩm Thường. Mua thêm ${((minOrderAmount - regularAmount)).toLocaleString("vi-VN")}đ sản phẩm nguyên giá để áp dụng!`
          );
        }

        const percentage = Number(discount.percentage || 0);
        let calculatedDiscount = Math.round((regularAmount * percentage) / 100);
        const maxDiscount =
          discount.max_discount_amount === null ||
          discount.max_discount_amount === undefined
            ? null
            : Number(discount.max_discount_amount);

        if (maxDiscount !== null) {
          calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
        }

        discountAmount = Math.min(regularAmount, Math.max(0, calculatedDiscount));
        discountCodeApplied = discount.code;
        discountIdApplied = discount.id;
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);

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
            receiver_phone: receiver_phone
              ? this.normalizePhoneNumber(receiver_phone)
              : "",
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

      // Tạo hồ sơ uy tín cho số điện thoại nếu là đơn giao hàng hoặc mang đi
      if (order_type !== "dine-in") {
        const normalizedPhone = this.normalizePhoneNumber(receiver_phone);
        if (normalizedPhone && normalizedPhone.length >= 10) {
          await OrderRepository.createReputationProfileIfNotExists(
            connection,
            normalizedPhone
          );
        }
      }

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

  async validateDiscount(code, items) {
    const normalizedCode = String(code || "").trim();

    if (!normalizedCode) {
      throw this.createBadRequestError("Vui lòng nhập mã giảm giá");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw this.createBadRequestError("Giỏ hàng trống");
    }

    const connection = await OrderRepository.getConnection();
    try {
      const cartTotals = await this.calculateCartAmounts(connection, items);
      const subtotal = cartTotals.totalAmount;
      const regularAmount = cartTotals.regularAmount;
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
      
      if (regularAmount === 0) {
         throw this.createBadRequestError("Không thể áp dụng mã giảm giá vì giỏ hàng của bạn chỉ toàn sản phẩm Flash Sale!");
      }

      if (regularAmount < minOrderAmount) {
        throw this.createBadRequestError(
          `Voucher chỉ áp dụng cho sản phẩm Thường. Mua thêm ${(minOrderAmount - regularAmount).toLocaleString("vi-VN")}đ sản phẩm nguyên giá để áp dụng!`
        );
      }

      const percentage = Number(discount.percentage || 0);
      let calculatedDiscount = Math.round((regularAmount * percentage) / 100);
      const maxDiscount =
        discount.max_discount_amount === null ||
        discount.max_discount_amount === undefined
          ? null
          : Number(discount.max_discount_amount);

      if (maxDiscount !== null) {
        calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
      }

      const discountAmount = Math.min(regularAmount, Math.max(0, calculatedDiscount));

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

  // Hủy đơn hàng bởi khách hàng (khi đang ở trạng thái pending hoặc preparing)
  async cancelOrderByUser(orderId, userId) {
    const order = await OrderRepository.findOrderByIdAndUser(orderId, userId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (!["pending", "preparing"].includes(order.status)) {
      throw new ErrorResponse(
        400,
        "Chỉ có thể hủy đơn ở trạng thái chờ xác nhận hoặc đang chuẩn bị"
      );
    }

    await OrderRepository.cancelOrderByUser(orderId, userId);

    return {
      order_id: orderId,
      status: "cancelled",
    };
  }

  // Xác nhận đơn hàng đang chờ xử lý bởi nhân viên (chuyển sang trạng thái preparing)
  async confirmDeliveryPreparing(orderId) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Chỉ áp dụng cho đơn giao hàng");
    }

    if (order.status !== "pending") {
      throw new ErrorResponse(400, "Chỉ xác nhận đơn đang chờ xử lý");
    }

    if (Number(order.is_paid) === 1 && order.payment_status !== "paid") {
      throw new ErrorResponse(400, "Trạng thái thanh toán của đơn không hợp lệ");
    }

    await OrderRepository.updateOrderStatus(orderId, "preparing");

    return {
      order_id: orderId,
      user_id: order.user_id,
      status: "preparing",
    };
  }

  // Hủy đơn hàng đang chờ xử lý bởi nhân viên (chuyển sang trạng thái cancelled)
  async cancelDeliveryOrderByStaff(orderId) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Chỉ áp dụng cho đơn giao hàng");
    }

    if (order.status !== "pending") {
      throw new ErrorResponse(400, "Chỉ hủy đơn đang chờ xử lý");
    }

    if (Number(order.is_paid) !== 0) {
      throw new ErrorResponse(400, "Chỉ hủy đơn chưa thanh toán");
    }

    // chuyển trạng thái đơn hàng về cancelled
    await OrderRepository.updateOrderStatus(orderId, "cancelled");

    // Giữ payment_status ở giá trị hợp lệ của ENUM
    await OrderRepository.updatePaymentStatusByOrderId(orderId, "pending");

    return {
      order_id: orderId,
      status: "cancelled",
    };
  }

  async markOrderPrintSuccess(orderId) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    await OrderRepository.updateOrderPrintStatus(orderId, "SUCCESS");

    return {
      order_id: orderId,
      print_status: "SUCCESS",
    };
  }

  async markDeliveryDeliveringByStaff(orderId) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Chỉ áp dụng cho đơn giao hàng");
    }

    if (order.status !== "served") {
      throw new ErrorResponse(400, "Chỉ chuyển giao khi đơn ở trạng thái sẵn sàng giao");
    }

    await OrderRepository.updateOrderStatus(orderId, "delivering");

    return {
      order_id: orderId,
      status: "delivering",
    };
  }

  async cancelDeliveringOrderByStaff(orderId) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Chỉ áp dụng cho đơn giao hàng");
    }

    if (order.status !== "delivering") {
      throw new ErrorResponse(400, "Chỉ hủy đơn ở trạng thái đang giao");
    }

    await OrderRepository.updateOrderStatus(orderId, "cancelled");

    return {
      order_id: orderId,
      status: "cancelled",
    };
  }

  async markDeliveryCompletedByStaff(orderId, { cash_received } = {}) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Chỉ áp dụng cho đơn giao hàng");
    }

    if (order.status !== "delivering") {
      throw new ErrorResponse(400, "Chỉ xác nhận hoàn tất đơn đang giao");
    }

    const isAlreadyPaid =
      Number(order.is_paid) === 1 ||
      String(order.payment_status || "").toLowerCase() === "paid";

    let cashReceivedAmount = null;
    let changeAmount = 0;

    if (!isAlreadyPaid) {
      cashReceivedAmount = Number(cash_received);
      const totalAmount = Number(order.total_amount || 0);

      if (!Number.isFinite(cashReceivedAmount) || cashReceivedAmount <= 0) {
        throw new ErrorResponse(
          400,
          "Vui lòng nhập số tiền khách thanh toán hợp lệ"
        );
      }

      if (cashReceivedAmount < totalAmount) {
        throw new ErrorResponse(
          400,
          "Số tiền khách thanh toán không đủ để hoàn tất đơn"
        );
      }

      changeAmount = Math.max(0, cashReceivedAmount - totalAmount);

      await OrderRepository.updateOrderPaidStatus(orderId, true);
      await OrderRepository.updatePaymentStatusByOrderId(orderId, "paid");
    }

    await OrderRepository.updateOrderStatus(orderId, "completed");

    return {
      order_id: orderId,
      status: "completed",
      is_paid: 1,
      cash_received: cashReceivedAmount,
      change_amount: changeAmount,
    };
  }

  async getDeliveryOrderDetailForStaff(orderId) {
    const order = await OrderRepository.findOrderDetailForStaff(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    if (order.order_type !== "delivery") {
      throw new ErrorResponse(400, "Đây không phải đơn giao hàng");
    }

    const items = await OrderRepository.findOrderItems(orderId);

    return {
      ...order,
      items,
    };
  }

  async savePayosReturn({ orderCode, payosId, status }) {
    if (!orderCode) throw new ErrorResponse(400, "Thiếu orderCode");

    const order = await OrderRepository.findOrderById(orderCode);
    
    const isPaid = status === "PAID";
    const paymentStatus = isPaid ? "paid" : "pending";

    await OrderRepository.updatePaymentByOrderCode(orderCode, {
      transaction_id: payosId || null,
      payment_status: paymentStatus,
    });

    if (isPaid) {
      await OrderRepository.updateOrderPaidStatus(orderCode, true);
    }

    return { 
      saved: true,
      order_id: orderCode,
      user_id: order?.user_id,
      payment_status: paymentStatus,
      is_paid: isPaid ? 1 : 0,
    };
  }

  async getAllOrders({ page = 1, limit = 20, status = "all" } = {}) {
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [orders, totalCount] = await Promise.all([
      OrderRepository.findAllOrders({ limit, offset, status }),
      OrderRepository.countAllOrders({ status })
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
}

module.exports = new OrderOnlineService();
