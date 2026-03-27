const TakeawayRepository = require('../repositories/TakeawayRepository');
const ErrorResponse = require('../utils/ErrorResponse');

const { payOS } = require('../config/payos');

class TakeawayService {
  //HELPER: build + validate items
  async _buildItems(connection, items) {
    const normalized = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const toppings = Array.isArray(item.toppings) ? item.toppings : [];

      if (!item.product_size_id)
        throw new ErrorResponse(400, 'Thiếu product_size_id');

      const productSize = await TakeawayRepository.findProductSizeById(
        connection,
        item.product_size_id,
      );

      if (!productSize) throw new ErrorResponse(400, 'Sản phẩm không tồn tại');
      if (productSize.is_deleted || productSize.product_deleted)
        throw new ErrorResponse(
          400,
          `Sản phẩm "${productSize.name}" đã bị xóa`,
        );
      if (productSize.status !== 'available')
        throw new ErrorResponse(
          400,
          `Sản phẩm "${productSize.name}" hiện không khả dụng`,
        );

      const basePrice = Number(productSize.price);
      let toppingsTotal = 0;
      const normalizedToppings = [];

      for (const t of toppings) {
        const toppingId = Number(t.topping_id);
        const toppingQty = Math.max(1, Number(t.quantity) || 1);

        if (!toppingId) throw new ErrorResponse(400, 'Topping không hợp lệ');

        const topping = await TakeawayRepository.findToppingById(
          connection,
          toppingId,
        );
        if (!topping)
          throw new ErrorResponse(400, `Topping id=${toppingId} không tồn tại`);

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
      subtotal += unitPrice * quantity;
      normalized.push({
        product_size_id: productSize.id,
        name: productSize.name,
        size: productSize.size,
        quantity,
        price: unitPrice,
        note: item.note?.trim() || null,
        toppings: normalizedToppings,
      });
    }

    return { normalizedItems: normalized, subtotal };
  }

  // HELPER: validate + tính discount
  async _applyDiscount(connection, discountCode, subtotal) {
    if (!discountCode)
      return { discountAmount: 0, discountId: null, discountCode: null };

    const discount = await TakeawayRepository.findDiscountByCode(
      connection,
      String(discountCode).trim(),
    );

    if (!discount) throw new ErrorResponse(400, 'Mã giảm giá không tồn tại');

    const now = new Date();
    if (discount.valid_from && now < new Date(discount.valid_from))
      throw new ErrorResponse(400, 'Mã giảm giá chưa đến thời gian sử dụng');
    if (discount.valid_until && now > new Date(discount.valid_until))
      throw new ErrorResponse(400, 'Mã giảm giá đã hết hạn');

    const usageLimit =
      discount.usage_limit == null ? null : Number(discount.usage_limit);
    const usedCount = Number(discount.used_count || 0);
    if (usageLimit !== null && usedCount >= usageLimit)
      throw new ErrorResponse(400, 'Mã giảm giá đã hết lượt sử dụng');

    const minOrder = Number(discount.min_order_amount || 0);
    if (subtotal < minOrder)
      throw new ErrorResponse(
        400,
        `Đơn tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để dùng mã này`,
      );

    const percentage = Number(discount.percentage || 0);
    let discountAmount = Math.round((subtotal * percentage) / 100);
    const maxDiscount =
      discount.max_discount_amount == null
        ? null
        : Number(discount.max_discount_amount);
    if (maxDiscount !== null)
      discountAmount = Math.min(discountAmount, maxDiscount);
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

    return {
      discountAmount,
      discountId: discount.id,
      discountCode: discount.code,
    };
  }

  // payOS
  async _createPayosLink(orderId, amount, items, returnUrl, cancelUrl) {
    if (!payOS) {
      throw new ErrorResponse(500, 'PayOS chưa được cấu hình');
    }

    const body = {
      orderCode: orderId,
      amount: amount,
      description: `TW${String(orderId).padStart(6, '0')}`.slice(0, 25),
      items: items.map((i) => ({
        name: i.name
          ? `${i.name} (${i.size})`.slice(0, 50) 
          : `SP-${i.product_size_id}`,
        quantity: Number(i.quantity),
        price: Number(i.price),
      })),
      returnUrl: returnUrl || process.env.PAYOS_RETURN_TAKEAWAY_ORDER_URL,
      cancelUrl: cancelUrl || process.env.PAYOS_CANCEL_TAKEAWAY_ORDER_URL,
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    // console.log(paymentLinkResponse)

    return {
      checkout_url: paymentLinkResponse.checkoutUrl,
      qr_code: paymentLinkResponse.qrCode, // base64 PNG
      // payment_link_id: paymentLinkResponse.paymentLinkId,
    };
  }

  // TẠO ĐƠN — gộp thanh toán luôn
  // Cash  → paid ngay, barista có thể nhận
  // PayOS → pending, trả về checkout_url, barista chờ webhook xác nhận
  async createTakeawayOrder(payload, staffUser) {
    const { items, discount_code, payment_method, returnUrl, cancelUrl } = payload;

    if (!Array.isArray(items) || items.length === 0)
      throw new ErrorResponse(400, 'Giỏ hàng trống');
    if (!['cash', 'payos'].includes(payment_method))
      throw new ErrorResponse(400, 'Phương thức thanh toán không hợp lệ');

    const connection = await TakeawayRepository.getConnection();
    try {
      await connection.beginTransaction();

      const { normalizedItems, subtotal } = await this._buildItems(
        connection,
        items,
      );
      const { discountAmount, discountId, discountCode } =
        await this._applyDiscount(connection, discount_code, subtotal);
      const finalAmount = Math.max(0, subtotal - discountAmount);

      const isCash = payment_method === 'cash';

      // create order
      const orderId = await TakeawayRepository.createOrder(connection, {
        user_id: null,
        created_by: staffUser.id,
        order_type: 'takeaway',
        total_amount: finalAmount,
        discount_id: discountId,
      });

      for (const item of normalizedItems) {
        // create order detail
        const detailId = await TakeawayRepository.createOrderDetail(
          connection,
          {
            order_id: orderId,
            product_size_id: item.product_size_id,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          },
        );
        // create topping
        for (const t of item.toppings) {
          await TakeawayRepository.createOrderDetailTopping(connection, {
            order_detail_id: detailId,
            topping_id: t.topping_id,
            quantity: t.quantity,
            price: t.price,
          });
        }
      }

      // Cash → paid ngay, ghi paid_amount = finalAmount
      // PayOS → pending, paid_amount = 0 (chờ webhook)
      await TakeawayRepository.createOrderPayment(connection, {
        order_id: orderId,
        payment_method,
        payment_status: isCash ? 'paid' : 'pending',
        amount: finalAmount,
        paid_amount: isCash ? finalAmount : 0,
      });

      if (isCash) {
        await connection.query(
          `UPDATE orders SET is_paid = 1, paid_at = NOW() WHERE id = ?`,
          [orderId],
        );
      }

      if (discountId) {
        await TakeawayRepository.incrementDiscountUsedCount(
          connection,
          discountId,
        );
      }

      await connection.commit();

      const response = {
        order_id: orderId,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        discount_code: discountCode,
        total_amount: finalAmount,
        payment_method,
        is_paid: isCash,
        status: 'pending',
      };

      // if payment by payOS
      if (!isCash) {
        const payosData = await this._createPayosLink(
          orderId,
          finalAmount,
          normalizedItems,
          returnUrl,
          cancelUrl
        );
        response.checkout_url = payosData.checkout_url;
        response.qr_code = payosData.qr_code;
      }

      return response;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // SỬA ĐƠN — cho phép cả khi đã paid, chỉ chặn khi barista đang làm
  //
  // Logic tiền:
  //   - Nếu chưa paid: cập nhật bình thường
  //   - Nếu đã paid:
  //       newAmount > paid_amount → thu thêm (extra_charge)
  //       newAmount < paid_amount → hoàn tiền (refund_amount)
  //       newAmount = paid_amount → không đổi tiền
  async updateTakeawayOrder(orderId, payload, staffUser) {
    const order = await TakeawayRepository.findOrderById(orderId);

    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
    if (order.order_type !== 'takeaway')
      throw new ErrorResponse(400, 'Chỉ có thể sửa đơn takeaway');
    if (order.status === 'preparing')
      throw new ErrorResponse(
        400,
        'Barista đang chuẩn bị đơn này, không thể sửa',
      );
    if (!['pending'].includes(order.status))
      throw new ErrorResponse(
        400,
        `Đơn đang ở trạng thái "${order.status}", không thể sửa`,
      );

    const { items, discount_code } = payload;
    if (!Array.isArray(items) || items.length === 0)
      throw new ErrorResponse(400, 'Giỏ hàng trống');

    const payment = await TakeawayRepository.findOrderPayment(orderId);
    const alreadyPaid = order.is_paid && payment?.payment_status === 'paid';
    const oldPaidAmount = alreadyPaid ? Number(payment.paid_amount || 0) : 0;

    const connection = await TakeawayRepository.getConnection();
    try {
      await connection.beginTransaction();

      // Hoàn lại used_count của discount cũ
      if (order.discount_id) {
        await connection.query(
          `UPDATE discount SET used_count = GREATEST(0, used_count - 1) WHERE id = ?`,
          [order.discount_id],
        );
      }

      // Xoá items cũ (cascade xoá toppings)
      await TakeawayRepository.deleteOrderDetails(connection, orderId);

      // Build lại items + discount mới
      const { normalizedItems, subtotal } = await this._buildItems(
        connection,
        items,
      );
      const { discountAmount, discountId, discountCode } =
        await this._applyDiscount(connection, discount_code, subtotal);
      const newAmount = Math.max(0, subtotal - discountAmount);

      // Cập nhật order
      await TakeawayRepository.updateOrderAmounts(connection, {
        orderId,
        total_amount: newAmount,
        discount_id: discountId,
      });

      // Cập nhật payment
      if (alreadyPaid) {
        // paid_amount giữ nguyên (đã thu thực tế), chỉ update amount + adjustment
        await TakeawayRepository.updatePaymentAfterEdit(connection, {
          orderId,
          newAmount,
          oldPaidAmount,
        });
      } else {
        // Chưa paid → cập nhật amount bình thường
        await connection.query(
          `UPDATE order_payments SET amount = ? WHERE order_id = ?`,
          [newAmount, orderId],
        );
      }

      // Insert items mới
      for (const item of normalizedItems) {
        const detailId = await TakeawayRepository.createOrderDetail(
          connection,
          {
            order_id: orderId,
            product_size_id: item.product_size_id,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          },
        );
        for (const t of item.toppings) {
          await TakeawayRepository.createOrderDetailTopping(connection, {
            order_detail_id: detailId,
            topping_id: t.topping_id,
            quantity: t.quantity,
            price: t.price,
          });
        }
      }

      if (discountId) {
        await TakeawayRepository.incrementDiscountUsedCount(
          connection,
          discountId,
        );
      }

      await connection.commit();

      // Tính toán tiền điều chỉnh để thông báo cho staff
      const adjustment = newAmount - oldPaidAmount;
      const response = {
        order_id: orderId,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        discount_code: discountCode,
        total_amount: newAmount,
        status: 'pending',
        payment_adjustment: null,
      };

      if (alreadyPaid) {
        if (adjustment > 0) {
          response.payment_adjustment = {
            type: 'extra_charge',
            amount: adjustment,
            message: `Thu thêm khách ${adjustment.toLocaleString('vi-VN')}đ`,
          };
        } else if (adjustment < 0) {
          response.payment_adjustment = {
            type: 'refund',
            amount: Math.abs(adjustment),
            message: `Hoàn lại khách ${Math.abs(adjustment).toLocaleString('vi-VN')}đ`,
          };
        } else {
          response.payment_adjustment = {
            type: 'no_change',
            amount: 0,
            message: 'Số tiền không thay đổi',
          };
        }
      }

      return response;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // HỦY ĐƠN — cho phép hủy kể cả đã paid, chỉ chặn khi barista đang làm
  async cancelTakeawayOrder(orderId, staffUser) {
    const order = await TakeawayRepository.findOrderById(orderId);
    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
    if (order.order_type !== 'takeaway')
      throw new ErrorResponse(400, 'Không phải đơn takeaway');
    if (order.status === 'preparing')
      throw new ErrorResponse(
        400,
        'Barista đang chuẩn bị, liên hệ barista trước khi hủy',
      );
    if (!['pending'].includes(order.status))
      throw new ErrorResponse(400, 'Không thể hủy đơn ở trạng thái này');

    const payment = await TakeawayRepository.findOrderPayment(orderId);
    const alreadyPaid = order.is_paid && payment?.payment_status === 'paid';
    const refundAmount = alreadyPaid ? Number(payment.paid_amount || 0) : 0;

    const connection = await TakeawayRepository.getConnection();
    try {
      await connection.beginTransaction();

      await TakeawayRepository.cancelOrder(connection, orderId);

      if (alreadyPaid) {
        await TakeawayRepository.refundPayment(connection, orderId);
      }

      // Trả lại used_count discount
      if (order.discount_id) {
        await connection.query(
          `UPDATE discount SET used_count = GREATEST(0, used_count - 1) WHERE id = ?`,
          [order.discount_id],
        );
      }

      await connection.commit();

      return {
        order_id: orderId,
        status: 'cancelled',
        refund: alreadyPaid
          ? {
              amount: refundAmount,
              message: `Hoàn lại khách ${refundAmount.toLocaleString('vi-VN')}đ`,
            }
          : null,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // BARISTA NHẬN ĐƠN (optimistic lock)
  async assignToBarista(orderId, baristaUser) {
    const order = await TakeawayRepository.findOrderById(orderId);
    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
    if (order.status !== 'pending')
      throw new ErrorResponse(400, 'Đơn không ở trạng thái chờ');

    const payment = await TakeawayRepository.findOrderPayment(orderId);
    if (!payment || payment.payment_status !== 'paid')
      throw new ErrorResponse(400, 'Đơn chưa được thanh toán, chưa thể nhận');

    const success = await TakeawayRepository.assignBarista(
      orderId,
      baristaUser.id,
    );
    if (!success)
      throw new ErrorResponse(409, 'Đơn đã được barista khác nhận rồi');

    return {
      order_id: orderId,
      assigned_barista_id: baristaUser.id,
      status: 'preparing',
    };
  }

  // BARISTA HOÀN THÀNH
  async markServedByBarista(orderId, baristaUser) {
    const order = await TakeawayRepository.findOrderById(orderId);
    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
    if (Number(order.assigned_barista_id) !== Number(baristaUser.id))
      throw new ErrorResponse(403, 'Bạn không phải barista được giao đơn này');

    const success = await TakeawayRepository.completeByBarista(
      orderId,
      baristaUser.id,
    );
    if (!success) throw new ErrorResponse(400, 'Không thể cập nhật trạng thái');

    return { order_id: orderId, status: 'served' };
  }

  // STAFF XÁC NHẬN GIAO KHÁCH
  async markCompleted(orderId, staffUser) {
    const order = await TakeawayRepository.findOrderById(orderId);
    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');
    if (order.status !== 'served')
      throw new ErrorResponse(400, 'Đơn chưa sẵn sàng để giao cho khách');

    const success = await TakeawayRepository.markCompleted(orderId);
    if (!success) throw new ErrorResponse(400, 'Không thể cập nhật trạng thái');

    return { order_id: orderId, status: 'completed' };
  }

  // HÓA ĐƠN
  async getReceipt(orderId) {
    const order = await TakeawayRepository.findOrderById(orderId);
    if (!order) throw new ErrorResponse(404, 'Đơn hàng không tồn tại');

    const items = await TakeawayRepository.findOrderItems(orderId);
    const payment = await TakeawayRepository.findOrderPayment(orderId);

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    const paidAmount = payment ? Number(payment.paid_amount || 0) : 0;

    return {
      receipt: {
        order_id: order.id,
        order_code: `${String(order.id).padStart(6, '0')}`,
        created_at: order.created_at,
        paid_at: order.paid_at,
        staff:
          `${order.staff_first_name || ''} ${order.staff_last_name || ''}`.trim(),
        barista: order.barista_first_name
          ? `${order.barista_first_name} ${order.barista_last_name}`.trim()
          : null,
        order_type: order.order_type,
        status: order.status,
        items: items.map((item) => ({
          product_name: item.product_name,
          size: item.size,
          quantity: item.quantity,
          unit_price: Number(item.price),
          line_total: Number(item.price) * Number(item.quantity),
          note: item.note,
          toppings: item.toppings,
        })),
        subtotal_amount: subtotal,
        discount_code: order.discount_code || null,
        discount_percentage: order.discount_percentage
          ? Number(order.discount_percentage)
          : null,
        discount_amount: subtotal - Number(order.total_amount),
        total_amount: Number(order.total_amount),
        receiver_name: order.receiver_name || null,
        receiver_phone: order.receiver_phone || null,
        receiver_email: order.receiver_email || null,
        address: order.address || null,
        delivery_note: order.delivery_note || order.note || null,
        payment: {
          method: payment?.payment_method || null,
          status: payment?.payment_status || null,
          paid_amount: paidAmount, // số tiền đã thực thu
          current_amount: payment ? Number(payment.amount) : null, // tổng đơn hiện tại
          transaction_id: payment?.transaction_id || null,
          paid_at: payment?.paid_at || null,
        },
      },
    };
  }
}

module.exports = new TakeawayService();
