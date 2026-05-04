const QrOrderService = require("../services/QrOrderService");
const NotificationService = require("../services/NotificationService");

class QrOrderController {
  // Cash orders: save to DB immediately, emit socket right away
  async checkout(req, res, next) {
    try {
      const result = await QrOrderService.checkout(req.body, req.user || null);

      const io = req.app.get("io");
      if (io) {
        io.emit("new-dine-in-order", {
          order_id: result.order_id,
          order_type: "dine-in",
          total_amount: result.total_amount,
          created_at: new Date().toISOString(),
          table_id: req.body.tableId,
        });
        io.emit("table:update", {
          table_id: req.body.tableId,
          status: "occupied",
        });
      }

      try {
        const notifPayload = {
          type: "new_order",
          title: "Đơn tại bàn mới",
          message: `Bàn ${req.body.tableId || "khuyết"} vừa đặt đơn mới #${result.order_id}`,
          link: "/staff/orders",
          entity_type: "order",
          entity_id: result.order_id,
        };
        const staffNotification = await NotificationService.createForStaffs(notifPayload);
        const baristaNotification = await NotificationService.createForBaristas(notifPayload);

        if (io) {
          if (staffNotification?.notification && Array.isArray(staffNotification.recipients)) {
            for (const recipient of staffNotification.recipients) {
              io.to(`user-${recipient.user_id}`).emit("staff:notification", {
                recipient_id: recipient.id,
                user_id: recipient.user_id,
                is_read: recipient.is_read,
                read_at: recipient.read_at,
                id: staffNotification.notification.id,
                type: staffNotification.notification.type,
                title: staffNotification.notification.title,
                message: staffNotification.notification.message,
                link: staffNotification.notification.link,
                entity_type: staffNotification.notification.entity_type,
                entity_id: staffNotification.notification.entity_id,
                created_at: staffNotification.notification.created_at,
              });
            }
          }
          if (baristaNotification?.notification && Array.isArray(baristaNotification.recipients)) {
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
      console.error("QR CHECKOUT ERROR:", error);
      next(error);
    }
  }

  // PayOS step 1: validate cart + calculate totals, return to frontend (no DB save)
  async validateCart(req, res, next) {
    try {
      const result = await QrOrderService.validateCart(req.body, req.user || null);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PayOS step 2: called from payment success page, save order after payment confirmed
  async confirmAfterPayment(req, res, next) {
    try {
      const cartPayload = req.body;
      const result = await QrOrderService.confirmAfterPayment(cartPayload, req.user || null);

      const io = req.app.get("io");
      if (io) {
        io.emit("new-dine-in-order", {
          order_id: result.order_id,
          order_type: "dine-in",
          total_amount: result.total_amount,
          created_at: new Date().toISOString(),
          table_id: result.table_id,
        });
        io.emit("table:update", {
          table_id: result.table_id,
          status: "occupied",
        });
      }

      try {
        const notifPayload = {
          type: "new_order",
          title: "Đơn tại bàn mới",
          message: `Bàn ${result.table_id} vừa thanh toán QR và đặt đơn #${result.order_id}`,
          link: "/staff/orders",
          entity_type: "order",
          entity_id: result.order_id,
        };
        const staffNotification = await NotificationService.createForStaffs(notifPayload);
        const baristaNotification = await NotificationService.createForBaristas(notifPayload);

        if (io) {
          if (staffNotification?.notification && Array.isArray(staffNotification.recipients)) {
            for (const recipient of staffNotification.recipients) {
              io.to(`user-${recipient.user_id}`).emit("staff:notification", {
                recipient_id: recipient.id,
                user_id: recipient.user_id,
                is_read: recipient.is_read,
                read_at: recipient.read_at,
                id: staffNotification.notification.id,
                type: staffNotification.notification.type,
                title: staffNotification.notification.title,
                message: staffNotification.notification.message,
                link: staffNotification.notification.link,
                entity_type: staffNotification.notification.entity_type,
                entity_id: staffNotification.notification.entity_id,
                created_at: staffNotification.notification.created_at,
              });
            }
          }
          if (baristaNotification?.notification && Array.isArray(baristaNotification.recipients)) {
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
        }
      } catch (error) {
        console.error("Failed to create/emit notification after qr payos confirm:", error);
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: "Đặt hàng thành công",
      });
    } catch (error) {
      console.error("QR CONFIRM AFTER PAYMENT ERROR:", error);
      next(error);
    }
  }
}

module.exports = new QrOrderController();
