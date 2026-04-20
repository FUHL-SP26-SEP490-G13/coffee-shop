const OrderRepository = require("../repositories/OrderRepository");
const CashSessionRepository = require("../repositories/CashSessionRepository");
const ReputationService = require("./ReputationService");
const LoyaltyService = require("./LoyaltyService");
const ErrorResponse = require("../utils/ErrorResponse");

class OrderOnlineService {
  static LEGACY_DELIVERY_SHIPPING_FEE = 20000;
  static DEFAULT_DELIVERY_SHIPPING_FEE = 15000;
  static DYNAMIC_SHIPPING_ROLLOUT_AT = new Date("2026-04-07T00:00:00.000Z").getTime();
  static MONEY_ROUNDING_UNIT = 100;
  static MAX_DELIVERY_DISTANCE_KM = 10;
  static FIRST_TIER_MAX_KM = 5;
  static FIRST_TIER_RATE = 2000;
  static SECOND_TIER_RATE = 1500;
  static OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

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

  buildDeliveryAddressString(address, wardName, provinceName) {
    const parts = [address, wardName, provinceName]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    const uniqueParts = [];
    const seen = new Set();

    for (const part of parts) {
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueParts.push(part);
    }

    return uniqueParts.length > 0 ? uniqueParts.join(", ") : null;
  }

  getHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getDrivingDistanceKm(originLat, originLng, destinationLat, destinationLng) {
    try {
      const url = `${OrderOnlineService.OSRM_BASE_URL}/${originLng},${originLat};${destinationLng},${destinationLat}?overview=false`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("OSRM request failed");
      }

      const data = await response.json();
      if (data?.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
        return Number(data.routes[0].distance) / 1000;
      }

      throw new Error("No route returned from OSRM");
    } catch (error) {
      const straightMeters = this.getHaversineDistanceMeters(
        originLat,
        originLng,
        destinationLat,
        destinationLng
      );
      return (straightMeters * 1.3) / 1000;
    }
  }

  calculateShippingFeeByDistanceKm(distanceKm) {
    const normalizedDistance = Math.max(0, Number(distanceKm || 0));
    const maxDistance = OrderOnlineService.MAX_DELIVERY_DISTANCE_KM;

    if (normalizedDistance >= maxDistance) {
      const exceededByKm = normalizedDistance - maxDistance;
      throw new ErrorResponse(
        400,
        `Khoảng cách ${normalizedDistance.toFixed(1)}km vượt quá giới hạn giao hàng ${maxDistance}km (vượt ${exceededByKm.toFixed(1)}km).`
      );
    }

    const tierOneKm = Math.min(normalizedDistance, OrderOnlineService.FIRST_TIER_MAX_KM);
    const tierTwoKm = Math.max(0, normalizedDistance - OrderOnlineService.FIRST_TIER_MAX_KM);

    const fee =
      tierOneKm * OrderOnlineService.FIRST_TIER_RATE +
      tierTwoKm * OrderOnlineService.SECOND_TIER_RATE;

    return Math.round(fee / OrderOnlineService.MONEY_ROUNDING_UNIT) * OrderOnlineService.MONEY_ROUNDING_UNIT;
  }

  calculateItemsSubtotal(items = []) {
    if (!Array.isArray(items)) return 0;

    return items.reduce((sum, item) => {
      const itemQuantity = Math.max(1, Number(item?.quantity) || 1);
      const unitPrice = Number(item?.price ?? item?.unit_price ?? 0);
      return sum + Math.max(0, unitPrice * itemQuantity);
    }, 0);
  }

  shouldUseLegacyShippingFallback(order) {
    const createdAtMs = new Date(order?.created_at || 0).getTime();
    return Number.isFinite(createdAtMs) && createdAtMs < OrderOnlineService.DYNAMIC_SHIPPING_ROLLOUT_AT;
  }

  getDerivedShippingFee(order, items = []) {
    if (String(order?.order_type || "").toLowerCase() !== "delivery") {
      return 0;
    }

    const feeFromOrder = Number(order?.delivery_fee ?? order?.shipping_fee);
    if (Number.isFinite(feeFromOrder) && feeFromOrder > 0) {
      return (
        Math.round(feeFromOrder / OrderOnlineService.MONEY_ROUNDING_UNIT) *
        OrderOnlineService.MONEY_ROUNDING_UNIT
      );
    }

    const loyaltyDiscountAmount =
      Math.max(0, Number(order?.used_points || 0)) * LoyaltyService.MONEY_PER_POINT;
    const orderTotal = Math.max(0, Number(order?.total_amount || 0));
    const itemsSubtotal = this.calculateItemsSubtotal(items);

    const derived =
      Math.round(
        (orderTotal + loyaltyDiscountAmount - itemsSubtotal) /
          OrderOnlineService.MONEY_ROUNDING_UNIT
      ) * OrderOnlineService.MONEY_ROUNDING_UNIT;
    if (Number.isFinite(derived) && derived > 0) {
      return derived;
    }

    if (this.shouldUseLegacyShippingFallback(order)) {
      return OrderOnlineService.LEGACY_DELIVERY_SHIPPING_FEE;
    }

    return 0;
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
      order_note,
      delivery_note,
      discount_code,
      used_points,
      items,
      latitude,
      longitude,
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
      const normalizedUsedPoints = Math.max(0, Number(used_points) || 0);

      if (!Number.isInteger(normalizedUsedPoints) || normalizedUsedPoints < 0) {
        throw new ErrorResponse(400, "Điểm sử dụng không hợp lệ");
      }

      if (normalizedUsedPoints > 0 && !userId) {
        throw new ErrorResponse(401, "Bạn cần đăng nhập để sử dụng điểm loyalty");
      }

      if (order_type !== "dine-in" && payment_method === "cash") {
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
            "Bạn đang có 2 đơn tiền mặt chưa thanh toán. Vui lòng thanh toán hoặc hủy bớt đơn cash, hoặc chọn PayOS cho đơn mới."
          );
        }
      }

      let activeOrderId = null;
      let existingOrderAmount = 0;
      let activeOrderSnapshot = null;

      if (order_type === "dine-in") {
        const activeOrder = await OrderRepository.findActiveOrderByTableId(
          connection,
          payload.table_id
        );
        if (activeOrder) {
          activeOrderSnapshot = activeOrder;
          activeOrderId = activeOrder.id;
          existingOrderAmount = Number(activeOrder.total_amount);

          if (normalizedUsedPoints > 0) {
            throw new ErrorResponse(
              400,
              "Không thể dùng điểm khi đang gộp thêm món vào đơn bàn hiện tại"
            );
          }
        }
      }

      const cartTotals = await this.calculateCartAmounts(connection, items);
      let totalAmount = cartTotals.totalAmount;
      const itemSubtotalAmount = cartTotals.totalAmount;
      let regularAmount = cartTotals.regularAmount;
      const normalizedItems = cartTotals.normalizedItems;
      let deliveryDistanceKm = 0;
      let shippingFee = 0;
      let existingAmount = 0;
      let existingDiscountAmount = 0;

      if (activeOrderId) {
        existingAmount = Math.max(
          0,
          Number(
            activeOrderSnapshot?.amount ?? activeOrderSnapshot?.total_amount
          ) || 0
        );
        existingDiscountAmount = Math.max(
          0,
          Number(activeOrderSnapshot?.discount_amount) || 0
        );
      }

      if (order_type === "delivery") {
        // Shipping fee feature by province/ward is disabled.
        shippingFee = 0;
        deliveryDistanceKm = 0;
      }

      totalAmount += shippingFee;

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

      let orderId = activeOrderId;
      if (!orderId) {
        // Lấy ca đang mở để gán vào đơn hàng
        const activeSession = await CashSessionRepository.findOpenSession();

        orderId = await OrderRepository.createOrder(connection, {
          user_id: userId,
          created_by: userId,
          customer_type: user ? "registered" : "guest",
          order_type,
          table_id: order_type === "dine-in" ? payload.table_id : null,
          status: "pending",
          total_amount: finalAmount,
          amount: itemSubtotalAmount,
          discount_amount: totalDiscountAmount,
          delivery_fee: shippingFee,
          used_points: normalizedUsedPoints,
          cash_session_id: activeSession ? activeSession.id : null,
          note: order_note?.trim() || null,
        });

        if (order_type === "dine-in") {
          await connection.query(
            "UPDATE tables SET status = 'occupied' WHERE id = ?",
            [payload.table_id]
          );
        }
      } else {
        const newTotal = existingOrderAmount + finalAmount;
        const newAmount = existingAmount + itemSubtotalAmount;
        const newDiscountAmount = existingDiscountAmount + totalDiscountAmount;

        await OrderRepository.updateOrderTotalAmount(connection, orderId, {
          totalAmount: newTotal,
          amount: newAmount,
          discountAmount: newDiscountAmount,
        });
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

      if (order_type !== "dine-in" || (order_note && order_note.trim())) {
        const deliveryAddressWithArea = this.buildDeliveryAddressString(
          address,
          null,
          null
        );

        const [existingInfo] = await connection.query(
          "SELECT id FROM order_delivery_info WHERE order_id = ?",
          [orderId]
        );

        if (existingInfo.length > 0) {
          await connection.query(
            "UPDATE order_delivery_info SET address = ?, note = ?, latitude = ?, longitude = ? WHERE order_id = ?",
            [deliveryAddressWithArea, delivery_note?.trim() || null, latitude ?? null, longitude ?? null, orderId]
          );
        } else {
          await OrderRepository.createOrderDeliveryInfo(connection, {
            order_id: orderId,
            receiver_name: receiver_name ? receiver_name.trim() : "",
            receiver_phone: receiver_phone
              ? this.normalizePhoneNumber(receiver_phone)
              : "",
            receiver_email: receiver_email?.trim() || null,
            address: deliveryAddressWithArea,
            note: delivery_note?.trim() || null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
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
        await ReputationService.ensureProfileForPhone(connection, receiver_phone);
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
        delivery_distance_km:
          order_type === "delivery"
            ? Number(deliveryDistanceKm.toFixed(2))
            : 0,
        shipping_fee: shippingFee,
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
    const orders = await OrderRepository.findOrdersByUser(userId);
    for (let order of orders) {
      order.items = await OrderRepository.findOrderItems(order.id);
      order.shipping_fee = this.getDerivedShippingFee(order, order.items);
    }
    return orders;
  }

  async getOrderDetailByUser(orderId, userId) {
    const order = await OrderRepository.findOrderByIdAndUser(orderId, userId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    const items = await OrderRepository.findOrderItems(orderId);
    const shippingFee = this.getDerivedShippingFee(order, items);

    return {
      ...order,
      shipping_fee: shippingFee,
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
    await LoyaltyService.syncOrderLoyaltyByOrderId(orderId);

    return {
      order_id: orderId,
      status: "cancelled",
    };
  }

  async syncCompletionRewardsForDelivery(orderId) {
    const normalizedOrderId = Number(orderId || 0);
    if (!normalizedOrderId) {
      throw new ErrorResponse(400, "Mã đơn hàng không hợp lệ");
    }

    const order = await OrderRepository.findOrderById(normalizedOrderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    const status = String(order.status || "").toLowerCase();
    const orderType = String(order.order_type || "").toLowerCase();
    const customerType = String(order.customer_type || "").toLowerCase();
    const paymentStatus = String(order.payment_status || "").toLowerCase();
    const isPaid = Number(order.is_paid) === 1 || paymentStatus === "paid";

    if (orderType !== "delivery" || status !== "completed" || !isPaid) {
      return {
        synced: false,
        reason: "order_not_completed_paid_delivery",
      };
    }

    if (customerType === "registered") {
      await LoyaltyService.syncOrderLoyaltyByOrderId(normalizedOrderId);
    }

    await ReputationService.applyScoreChangeByOrder({
      orderId: normalizedOrderId,
      changeAmount: 10,
      reasonType: "ORDER_SUCCESS",
      description:
        "Khách hàng nhận đơn thành công (delivery completed + paid)",
    });

    return {
      synced: true,
      order_id: normalizedOrderId,
      customer_type: customerType,
    };
  }

  async transitionOrderStatusByStaff(orderId, targetStatus, { cash_received } = {}) {
    const order = await OrderRepository.findOrderById(orderId);

    if (!order) {
      throw new ErrorResponse(404, "Đơn hàng không tồn tại");
    }

    const currentStatus = String(order.status || "").toLowerCase();
    const nextStatus = String(targetStatus || "").toLowerCase();
    const isAlreadyPaid =
      Number(order.is_paid) === 1 ||
      String(order.payment_status || "").toLowerCase() === "paid";

    if (!["preparing", "completed", "cancelled"].includes(nextStatus)) {
      throw new ErrorResponse(400, "Trạng thái chuyển không hợp lệ");
    }

    if (nextStatus === "preparing") {
      const customerType = String(order.customer_type || "").toLowerCase();
      const isCustomerOrder =
        ["registered", "guest", "customer"].includes(customerType) ||
        customerType === "";
      const isEligibleType = ["delivery", "takeaway"].includes(order.order_type);

      if (currentStatus !== "pending") {
        throw new ErrorResponse(400, "Chỉ được chuyển từ chờ xử lý sang đang chuẩn bị");
      }

      if (!isEligibleType || !isCustomerOrder) {
        throw new ErrorResponse(
          400,
          "Chỉ áp dụng cho đơn online giao hàng hoặc mang về do khách hàng đặt"
        );
      }

      if (Number(order.is_paid) === 1 && String(order.payment_status || "").toLowerCase() !== "paid") {
        throw new ErrorResponse(400, "Trạng thái thanh toán của đơn không hợp lệ");
      }

      await OrderRepository.updateOrderStatus(orderId, "preparing");

      if (!isAlreadyPaid) {
        await OrderRepository.updateOrderPaidStatus(orderId, true);
        const totalAmount = Number(order.total_amount || 0);
        await OrderRepository.updatePaymentStatusByOrderId(orderId, "paid", {
          cash_received: totalAmount,
          change_amount: 0,
        });
      }

      return {
        order_id: Number(orderId),
        user_id: order.user_id,
        status: "preparing",
      };
    }

    if (nextStatus === "cancelled") {
      if (!["pending", "preparing"].includes(currentStatus)) {
        throw new ErrorResponse(
          400,
          "Chỉ được hủy đơn ở trạng thái chờ xử lý hoặc đang chuẩn bị"
        );
      }

      if (isAlreadyPaid) {
        throw new ErrorResponse(400, "Đơn đã thanh toán không thể hủy");
      }

      await OrderRepository.updateOrderStatus(orderId, "cancelled");
      await OrderRepository.updatePaymentStatusByOrderId(orderId, "pending");
      await LoyaltyService.syncOrderLoyaltyByOrderId(orderId);

      // Delivery: preparing -> cancelled (khách không nhận) => -20 điểm uy tín
      if (order.order_type === "delivery" && currentStatus === "preparing") {
        await ReputationService.applyScoreChangeByOrder({
          orderId,
          changeAmount: -20,
          reasonType: "BOOM_ORDER",
          description:
            "Khách hàng không nhận đơn (staff xác nhận hủy từ trạng thái preparing)",
        });
      }

      return {
        order_id: orderId,
        status: "cancelled",
      };
    }

    if (currentStatus !== "preparing") {
      throw new ErrorResponse(400, "Chỉ được xác nhận hoàn tất đơn đang chuẩn bị");
    }

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
      await OrderRepository.updatePaymentStatusByOrderId(orderId, "paid", {
        cash_received: cashReceivedAmount,
        change_amount: changeAmount,
      });
    }

    await OrderRepository.updateOrderStatus(orderId, "completed");
    await this.syncCompletionRewardsForDelivery(orderId);

    return {
      order_id: orderId,
      status: "completed",
      is_paid: 1,
      cash_received: cashReceivedAmount,
      change_amount: changeAmount,
    };
  }

  // Xác nhận đơn hàng đang chờ xử lý bởi nhân viên (chuyển sang trạng thái preparing)
  async confirmDeliveryPreparing(orderId) {
    return this.transitionOrderStatusByStaff(orderId, "preparing");
  }

  // Hủy đơn hàng bởi nhân viên (chỉ từ preparing)
  async cancelDeliveryOrderByStaff(orderId) {
    return this.transitionOrderStatusByStaff(orderId, "cancelled");
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
    await LoyaltyService.syncOrderLoyaltyByOrderId(orderId);

    return {
      order_id: orderId,
      status: "cancelled",
    };
  }

  async markDeliveryCompletedByStaff(orderId, { cash_received } = {}) {
    return this.transitionOrderStatusByStaff(orderId, "completed", {
      cash_received,
    });
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
      shipping_fee: this.getDerivedShippingFee(order, items),
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
      await this.syncCompletionRewardsForDelivery(orderCode);
    }

    return { 
      saved: true,
      order_id: orderCode,
      user_id: order?.user_id,
      order_status: isCancelled ? "cancelled" : order?.status,
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
