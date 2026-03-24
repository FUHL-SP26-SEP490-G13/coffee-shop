const OrderOnlineService = require("../services/OrderOnlineService");
const NotificationService = require("../services/NotificationService");

class OrderOnlineController {
  async checkout(req, res, next) {
    try {
      const result = await OrderOnlineService.checkout(req.body, req.user || null);
      const orderType = req.body?.order_type || "delivery";

      // Emit socket event for new order
      const io = req.app.get("io");
      if (io) {
        const eventName = orderType === "delivery" ? "new-delivery-order" : "new-takeaway-order";
        
        io.emit(eventName, {
          order_id: result.order_id,
          order_type: orderType,
          total_amount: result.total_amount,
          created_at: new Date().toISOString(),
        });
      }

      // Save operational notifications into DB and emit to each recipient room
      try {
        const notificationPayload = {
          type: "new_order",
          title: orderType === "delivery" ? "Đơn giao hàng mới" : "Đơn mang đi mới",
          message:
            orderType === "delivery"
              ? `Có đơn giao hàng mới #${result.order_id}`
              : `Có đơn mang đi mới #${result.order_id}`,
          link: orderType === "delivery" ? "/staff/delivery" : "/staff/takeaway",
          entity_type: "order",
          entity_id: result.order_id,
        };

        // thông báo cho staff
        const staffNotification = await NotificationService.createForStaffs(notificationPayload);

        // thông báo cho barista
        const baristaNotification = await NotificationService.createForBaristas(notificationPayload);

        const notification = staffNotification?.notification || baristaNotification?.notification;
        const recipients = [
          ...(Array.isArray(staffNotification?.recipients) ? staffNotification.recipients : []),
          ...(Array.isArray(baristaNotification?.recipients) ? baristaNotification.recipients : []),
        ];

        if (io && notification && recipients.length > 0) {
          for (const recipient of recipients) {
            io.to(`user-${recipient.user_id}`).emit("staff:notification", {
              recipient_id: recipient.id,
              user_id: recipient.user_id,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              link: notification.link,
              entity_type: notification.entity_type,
              entity_id: notification.entity_id,
              created_at: notification.created_at,
            });
          }
        }
      } catch (error) {
        console.error("Failed to create/emit operational notification:", error);
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: "Đặt hàng thành công",
      });
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      next(error);
    }
  }

  async validateDiscount(req, res, next) {
    try {
      const { code, items } = req.body;

      const result = await OrderOnlineService.validateDiscount(code, items);

      return res.json({
        success: true,
        data: result,
        message: "Áp dụng mã giảm giá thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res) {
    const userId = req.user.id || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để xem đơn hàng",
      });
    }
    
    const result = await OrderOnlineService.getOrdersByUser(userId);

    return res.json({
      success: true,
      data: result,
      message: "Lấy danh sách đơn hàng thành công",
    });
  }

  async getMyOrderDetail(req, res) {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    const result = await OrderOnlineService.getOrderDetailByUser(orderId, userId);

    return res.json({
      success: true,
      data: result,
      message: "Lấy chi tiết đơn hàng thành công",
    });
  }

  async cancel(req, res) {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    const result = await OrderOnlineService.cancelOrderByUser(orderId, userId);

    return res.json({
      success: true,
      data: result,
      message: "Hủy đơn hàng thành công",
    });
  }

  async confirmPreparing(req, res) {
    const orderId = Number(req.params.id);

    const result = await OrderOnlineService.confirmDeliveryPreparing(orderId);

    const io = req.app.get("io");

    // Notify baristas to start preparing drinks
    try {
      const baristaNotification = await NotificationService.createForBaristas({
        type: "order_prepare_requested",
        title: "Có đơn cần pha chế",
        message: `Đơn #${result.order_id} đã được nhân viên xác nhận, vui lòng bắt đầu pha chế`,
        link: "/barista/kitchen",
        entity_type: "order",
        entity_id: result.order_id,
      });

      if (io && baristaNotification?.notification && Array.isArray(baristaNotification.recipients)) {
        for (const recipient of baristaNotification.recipients) {
          io.to(`user-${recipient.user_id}`).emit("barista:notification", {
            recipient_id: recipient.id,
            user_id: recipient.user_id,
            is_read: recipient.is_read,
            read_at: recipient.read_at,
            id: baristaNotification.notification.id,
            type: baristaNotification.notification.type,
            title: baristaNotification.notification.title,
            message: baristaNotification.notification.message,
            link: baristaNotification.notification.link,
            entity_type: baristaNotification.notification.entity_type,
            entity_id: baristaNotification.notification.entity_id,
            created_at: baristaNotification.notification.created_at,
          });
        }
      }
    } catch (error) {
      console.error("Failed to notify baristas:", error);
    }

    // Notify order owner (if this order belongs to a registered user)
    if (result.user_id) {
      try {
        const customerNotification = await NotificationService.createForUsers(
          {
            type: "order_preparing",
            title: "Đơn hàng đang được chuẩn bị",
            message: `Đơn #${result.order_id} của bạn đang được pha chế`,
            link: `/my-orders/${result.order_id}`,
            entity_type: "order",
            entity_id: result.order_id,
          },
          [result.user_id]
        );

        if (io) {
          io.to(`user-${result.user_id}`).emit("order:status-changed", {
            order_id: result.order_id,
            status: result.status,
            message: "Đơn của bạn đang được chuẩn bị",
          });

          const recipient = customerNotification?.recipients?.[0];
          if (customerNotification?.notification && recipient) {
            io.to(`user-${result.user_id}`).emit("customer:notification", {
              recipient_id: recipient.id,
              user_id: recipient.user_id,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
              id: customerNotification.notification.id,
              type: customerNotification.notification.type,
              title: customerNotification.notification.title,
              message: customerNotification.notification.message,
              link: customerNotification.notification.link,
              entity_type: customerNotification.notification.entity_type,
              entity_id: customerNotification.notification.entity_id,
              created_at: customerNotification.notification.created_at,
            });
          }
        }
      } catch (error) {
        console.error("Failed to notify customer:", error);
      }
    }

    return res.json({
      success: true,
      data: result,
      message: "Xác nhận đơn thành công",
    });
  }

  async getDeliveryDetailForStaff(req, res) {
    const orderId = Number(req.params.id);

    const result = await OrderOnlineService.getDeliveryOrderDetailForStaff(orderId);

    return res.json({
      success: true,
      data: result,
      message: "Lấy chi tiết đơn giao hàng thành công",
    });
  }

  async cancelDeliveryByStaff(req, res) {
    const orderId = Number(req.params.id);

    const result = await OrderOnlineService.cancelDeliveryOrderByStaff(orderId);

    return res.json({
      success: true,
      data: result,
      message: "Hủy đơn giao hàng thành công",
    });
  }

  async payosReturn(req, res, next) {
    try {
      const { orderCode, payosId, status } = req.body;
      const result = await OrderOnlineService.savePayosReturn({ orderCode, payosId, status });

      // Emit socket event to customer when payment is completed
      const io = req.app.get("io");
      if (io && result.user_id && result.is_paid === 1) {
        io.to(`user-${result.user_id}`).emit("order:payment-completed", {
          order_id: result.order_id,
          payment_status: result.payment_status,
          message: "Thanh toán thành công. Đơn của bạn sẽ được chuẩn bị ngay",
        });
      }

      // Create notification for customer when payment is completed
      if (result.user_id && result.is_paid === 1) {
        try {
          await NotificationService.createForUsers({
            type: "payment_completed",
            title: "Thanh toán thành công",
            message: `Đơn #${result.order_id} được thanh toán thành công`,
            link: `/customer/orders/${result.order_id}`,
            entity_type: "order",
            entity_id: result.order_id,
          }, [result.user_id]);
        } catch (error) {
          console.error("Failed to create notification:", error);
        }
      }

      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderOnlineController();
