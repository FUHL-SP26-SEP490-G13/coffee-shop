const QrOrderService = require("../services/QrOrderService");
const NotificationService = require("../services/NotificationService");

class QrOrderController {
  async checkout(req, res, next) {
    try {
      const result = await QrOrderService.checkout(req.body, req.user || null);

      // Emit socket event for new order
      const io = req.app.get("io");
      if (io) {
        io.emit("new-dine-in-order", {
          order_id: result.order_id,
          order_type: "dine-in",
          total_amount: result.total_amount,
          created_at: new Date().toISOString(),
          table_id: req.body.tableId
        });
      }

      // Save operational notifications into DB and emit to each recipient room
      try {
        const notifTitle = "Đơn tại bàn mới";
        const notifMsg = `Bàn ${req.body.tableId || 'khuyết'} vừa đặt đơn mới #${result.order_id}`;
        const notifLink = "/staff/orders"; 

        const notificationPayload = {
          type: "new_order",
          title: notifTitle,
          message: notifMsg,
          link: notifLink,
          entity_type: "order",
          entity_id: result.order_id,
        };

        // thông báo cho staff
        const staffNotification = await NotificationService.createForStaffs(notificationPayload);

        // thông báo cho barista
        const baristaNotification = await NotificationService.createForBaristas(notificationPayload);

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
}

module.exports = new QrOrderController();
