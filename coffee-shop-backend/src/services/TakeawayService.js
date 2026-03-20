const TakeawayRepository = require('../repositories/TakeawayRepository');
const ErrorResponse = require('../utils/ErrorResponse');

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
        connection, item.product_size_id,
      );

      if (!productSize) throw new ErrorResponse(400, 'Sản phẩm không tồn tại');
      if (productSize.is_deleted || productSize.product_deleted)
        throw new ErrorResponse(400, `Sản phẩm "${productSize.name}" đã bị xóa`);
      if (productSize.status !== 'available')
        throw new ErrorResponse(400, `Sản phẩm "${productSize.name}" hiện không khả dụng`);

      const basePrice = Number(productSize.price);
      let toppingsTotal = 0;
      const normalizedToppings = [];

      for (const t of toppings) {
        const toppingId = Number(t.topping_id);
        const toppingQty = Math.max(1, Number(t.quantity) || 1);

        if (!toppingId) throw new ErrorResponse(400, 'Topping không hợp lệ');

        const topping = await TakeawayRepository.findToppingById(connection, toppingId);
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
      connection, String(discountCode).trim(),
    );

    if (!discount) throw new ErrorResponse(400, 'Mã giảm giá không tồn tại');

    const now = new Date();
    if (discount.valid_from && now < new Date(discount.valid_from))
      throw new ErrorResponse(400, 'Mã giảm giá chưa đến thời gian sử dụng');
    if (discount.valid_until && now > new Date(discount.valid_until))
      throw new ErrorResponse(400, 'Mã giảm giá đã hết hạn');

    const usageLimit = discount.usage_limit == null ? null : Number(discount.usage_limit);
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
      discount.max_discount_amount == null ? null : Number(discount.max_discount_amount);
    if (maxDiscount !== null) discountAmount = Math.min(discountAmount, maxDiscount);
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

    return { discountAmount, discountId: discount.id, discountCode: discount.code };
  }

  // TẠO ĐƠN — gộp thanh toán luôn
  // Cash  → paid ngay, barista có thể nhận
  // PayOS → pending, trả về checkout_url, barista chờ webhook xác nhận
  async createTakeawayOrder(payload, staffUser) {
    const { items, discount_code, payment_method } = payload;

    if (!Array.isArray(items) || items.length === 0)
      throw new ErrorResponse(400, 'Giỏ hàng trống');
    if (!['cash', 'payos'].includes(payment_method))
      throw new ErrorResponse(400, 'Phương thức thanh toán không hợp lệ');

    const connection = await TakeawayRepository.getConnection();
    try {
      await connection.beginTransaction();

      const { normalizedItems, subtotal } = await this._buildItems(connection, items);
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
        const detailId = await TakeawayRepository.createOrderDetail(connection, {
          order_id: orderId,
          product_size_id: item.product_size_id,
          quantity: item.quantity,
          price: item.price,
          note: item.note,
        });
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
        await TakeawayRepository.incrementDiscountUsedCount(connection, discountId);
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
        const payosData = await this._createPayosLink(orderId, finalAmount, normalizedItems);
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

  // ─── Internal: tạo PayOS link (dùng chung) ─────────────────────────────────
  async _createPayosLink(orderId, amount, items) {
    // Nếu chưa cài @payos/node thì bỏ comment require ở đầu file
    // const PayOS = require('@payos/node');
    // const payos = new PayOS(
    //   process.env.PAYOS_CLIENT_ID,
    //   process.env.PAYOS_API_KEY,
    //   process.env.PAYOS_CHECKSUM_KEY,
    // );
    // const payosRes = await payos.createPaymentLink({
    //   orderCode: orderId,
    //   amount,
    //   description: `TW-${String(orderId).padStart(6, '0')}`,
    //   items: items.map((i) => ({
    //     name: `${i.product_name || i.product_size_id} (${i.size || ''})`,
    //     quantity: Number(i.quantity),
    //     price: Number(i.price),
    //   })),
    //   returnUrl: process.env.PAYOS_RETURN_URL,
    //   cancelUrl: process.env.PAYOS_CANCEL_URL,
    // });
    // return { checkout_url: payosRes.checkoutUrl, qr_code: payosRes.qrCode };

    // Placeholder khi chưa tích hợp PayOS thật
    return {
      checkout_url: `https://pay.payos.vn/web/${orderId}`,
      qr_code: null,
    };
  }

}

module.exports = new TakeawayService();