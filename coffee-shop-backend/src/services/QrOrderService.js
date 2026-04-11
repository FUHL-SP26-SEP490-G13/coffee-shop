const QrOrderRepository = require("../repositories/QrOrderRepository");
const CashSessionRepository = require("../repositories/CashSessionRepository");
const ErrorResponse = require("../utils/ErrorResponse");
const { payOS } = require("../config/payos");

class QrOrderService {
  createBadRequestError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
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

      const productSize = await QrOrderRepository.findProductSizeById(
        connection,
        item.product_size_id
      );

      if (!productSize) {
        throw new ErrorResponse(400, "Sản phẩm không tồn tại");
      }

      if (!productSize.status || productSize.status.toLowerCase() !== "available") {
        throw new ErrorResponse(400, `Sản phẩm "${productSize.name}" hiện không khả dụng`);
      }

      let basePrice = Number(productSize.price);
      let isFlashSaleApplied = false;
      
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

        const topping = await QrOrderRepository.findToppingById(
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
        name: productSize.name,
        size: productSize.size,
        note: item.note || null
      });
    }

    return { totalAmount, regularAmount, flashSaleAmount, normalizedItems };
  }

  async _createPayosLink(orderId, amount, items, tableId) {
    if (!payOS) {
      throw new ErrorResponse(500, "PayOS chưa được cấu hình");
    }

    if (amount < 2000) {
      throw new ErrorResponse(400, "Số tiền thanh toán qua PayOS phải lớn hơn hoặc bằng 2000đ");
    }

    // PayOS requires orderCode to be integer and unique
    const uniqueOrderCode = Number(String(Date.now()).slice(-6) + String(orderId).padStart(4, "0"));

    const body = {
      orderCode: uniqueOrderCode,
      amount: amount,
      description: `Bàn ${tableId} DH ${orderId}`.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 25),
      items: items.map((i) => ({
        name: i.name ? `${i.name} (${i.size})`.replace(/[^a-zA-Z0-9 ()-]/g, "").slice(0, 50) : `SP-${i.product_size_id}`,
        quantity: Number(i.quantity),
        price: Number(i.price),
      })),
      returnUrl: process.env.PAYOS_RETURN_URL || "http://localhost:5173/payment-success",
      cancelUrl: process.env.PAYOS_CANCEL_URL || "http://localhost:5173/payment-cancel",
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    return {
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
    };
  }

  async checkout(payload, user) {
    const {
      tableId,
      paymentMethod,
      discountCode, // Thường QR không dùng voucher nhưng giữ lại cho chắc
      items,
      note,
    } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ErrorResponse(400, "Giỏ hàng trống");
    }

    if (!["cash", "payos"].includes(paymentMethod)) {
      throw new ErrorResponse(400, "Phương thức thanh toán không hợp lệ");
    }

    if (!tableId) {
        throw new ErrorResponse(400, "Thiếu thông tin bàn");
    }

    const connection = await QrOrderRepository.getConnection();

    try {
      await connection.beginTransaction();

      const cartTotals = await this.calculateCartAmounts(connection, items);
      let totalAmount = cartTotals.totalAmount;
      let regularAmount = cartTotals.regularAmount;
      const normalizedItems = cartTotals.normalizedItems;

      let discountAmount = 0;
      let discountCodeApplied = null;
      let discountIdApplied = null;

      const normalizedDiscountCode = String(discountCode || "").trim();
      if (normalizedDiscountCode) {
        const discount = await QrOrderRepository.findDiscountByCodeForCheckout(
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
      const userId = user?.id || null;

      // Lấy ca đang mở để gán vào đơn QR
      const activeSession = await CashSessionRepository.findOpenSession();

      const orderId = await QrOrderRepository.createOrder(connection, {
        user_id: userId,
        created_by: userId,
        customer_type: user ? "registered" : "guest",
        order_type: "dine-in",
        table_id: tableId,
        total_amount: finalAmount,
        amount: totalAmount,
        discount_amount: discountAmount,
        discount_id: discountIdApplied,
        cash_session_id: activeSession ? activeSession.id : null,
      });

      for (const item of normalizedItems) {
        let finalNote = item.note || "";
        if (note) {
          finalNote = finalNote ? `${finalNote} | Ghi chú chung: ${note}` : `Ghi chú chung: ${note}`;
        }

        const orderDetailId = await QrOrderRepository.createOrderDetail(
          connection,
          {
            order_id: orderId,
            product_size_id: item.product_size_id,
            quantity: item.quantity,
            price: item.price,
            note: finalNote || null
          }
        );

        for (const topping of item.toppings) {
          await QrOrderRepository.createOrderDetailTopping(connection, {
            order_detail_id: orderDetailId,
            topping_id: topping.topping_id,
            quantity: topping.quantity,
            price: topping.price,
          });
        }
      }



      await QrOrderRepository.createOrderPayment(connection, {
        order_id: orderId,
        payment_method: paymentMethod,
        payment_status: "pending",
        amount: finalAmount,
      });

      if (discountIdApplied) {
        await QrOrderRepository.incrementDiscountUsedCount(connection, discountIdApplied);
      }

      await connection.commit();

      const response = {
        order_id: orderId,
        subtotal_amount: totalAmount,
        discount_amount: discountAmount,
        discount_code: discountCodeApplied,
        total_amount: finalAmount,
        payment_method: paymentMethod
      };

      if (paymentMethod === "payos") {
         const payosData = await this._createPayosLink(orderId, finalAmount, normalizedItems, tableId);
         response.checkoutUrl = payosData.checkoutUrl;
      }

      return response;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new QrOrderService();
