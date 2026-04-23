const TableService = require('../services/TableService');
const NotificationService = require('../services/NotificationService');
const { ROLES } = require('../config/constants');
// const TableReservationService = require('../services/TableReservationService');

class TableController {
  /**
   * Get all tables
   */
  async getAllTables(req, res, next) {
    try {
      const { status } = req.query;
      const tables = await TableService.getAllTables({ status });
      res.json({
        success: true,
        data: tables,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single table
   */
  async getTable(req, res, next) {
    try {
      const table = await TableService.getTableById(req.params.id);
      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tables by area
   */
  async getTablesByArea(req, res, next) {
    try {
      const tables = await TableService.getTablesByArea(req.params.areaId);
      res.json({
        success: true,
        data: tables,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create table
   */
  async createTable(req, res, next) {
    try {
      const table = await TableService.createTable(req.body);
      res.status(201).json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update table
   */
  async updateTable(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Get old table state to check for status change
      const oldTable = await TableService.getTableById(id);

      const table = await TableService.updateTable(id, req.body);

      // Trigger notification if status changes to "occupied" (Có khách)
      if (status === "occupied" && oldTable.status !== "occupied") {
        const io = req.app.get("io");
        const result = await NotificationService.createForRole(ROLES.MANAGER, {
          type: "table_status",
          title: `Bàn ${table.code} có khách`,
          message: `Bàn ${table.code} đã cập nhật trạng thái là có khách`,
          link: "/admin/tables",
          entity_type: "table",
          entity_id: table.id,
        });

        if (io && result?.users?.length) {
          result.users.forEach((user) => {
            const recipient = result.recipients.find(
              (r) => r.user_id === user.id
            );
            if (!recipient) return;

            io.to(`user-${user.id}`).emit("admin:notification", {
              recipient_id: recipient.id,
              user_id: user.id,
              id: result.notification.id,
              type: result.notification.type,
              title: result.notification.title,
              message: result.notification.message,
              link: result.notification.link,
              entity_type: result.notification.entity_type,
              entity_id: result.notification.entity_id,
              created_at: result.notification.created_at,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
            });
          });
        }
      }

      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete table
   */
  async deleteTable(req, res, next) {
    try {
      await TableService.deleteTable(req.params.id);
      res.json({
        success: true,
        message: 'Xóa bàn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * API tạo mới bàn kèm QR code
   */
  async createTableWithQrCode(req, res, next) {
    try {
      const table = await TableService.createTableWithQrCode(req.body);
      res.status(201).json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * API cập nhật QR code cho bàn đã có sẵn
   */
  async updateQrForTable(req, res, next) {
    try {
      const table = await TableService.updateQrForTable(req.params.id);
      res.json({
        success: true,
        data: table,
      });
    } catch (error) {
      next(error);
    }
  }



  /**
   * Reserve table (Commented out)
   */
  // async reserveTable(req, res, next) {
  //   try {
  //     const reservation = await TableReservationService.createReservation(req.params.id, req.body);
  //     res.status(201).json({
  //       success: true,
  //       data: reservation,
  //       message: 'Đặt bàn thành công'
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  async getActiveOrder(req, res, next) {
    try {
      const { id } = req.params;
      const OrderService = require('../services/OrderService');
      const order = await OrderService.getActiveOrderForTable(id);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all unpaid orders for current table session
   */
  async getUnpaidOrders(req, res, next) {
    try {
      const { id } = req.params;
      const orders = await TableService.getUnpaidOrders(Number(id));

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer table: move all orders from source table to destination table
   */
  async transferTable(req, res, next) {
    try {
      const { from_table_id, to_table_id } = req.body;

      if (!from_table_id || !to_table_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp bàn nguồn và bàn đích',
        });
      }

      if (Number(from_table_id) === Number(to_table_id)) {
        return res.status(400).json({
          success: false,
          message: 'Bàn nguồn và bàn đích không được trùng nhau',
        });
      }

      const result = await TableService.transferTable(
        Number(from_table_id),
        Number(to_table_id)
      );

      res.json({
        success: true,
        message: `Đã chuyển bàn ${result.from.code} → ${result.to.code}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Settle debt for all unpaid orders of current table session.
   */
  async settleTableDebt(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_method, cash_received, order_ids, order_id } = req.body || {};

      // Support both singular and plural for flexibility
      const ids = order_ids || (order_id ? [order_id] : null);

      const result = await TableService.settleTableDebt(Number(id), {
        payment_method,
        cash_received,
        order_ids: ids,
      });

      return res.json({
        success: true,
        message: `Thanh toán  cho bàn ${result.table_code} thành công`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Merge active order(s) from source table to destination table.
   */
  async mergeOrders(req, res, next) {
    try {
      const { from_table_id, to_table_id } = req.body || {};

      if (!from_table_id || !to_table_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp bàn nguồn và bàn đích',
        });
      }

      if (Number(from_table_id) === Number(to_table_id)) {
        return res.status(400).json({
          success: false,
          message: 'Bàn nguồn và bàn đích không được trùng nhau',
        });
      }

      const result = await TableService.mergeOrder(
        Number(from_table_id),
        Number(to_table_id)
      );

      res.json({
        success: true,
        message: `Đã ghép order từ ${result.from.code} vào ${result.to.code}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Tách hóa đơn (Separate Bill)
   */
  async splitBill(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const bills = Array.isArray(payload?.bills) ? payload.bills : null;
      const items = Array.isArray(payload?.items) ? payload.items : null;

      if ((!bills || bills.length === 0) && (!items || items.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu tách đơn không hợp lệ'
        });
      }

      const result = await TableService.splitBill(Number(id), payload, req.user);

      res.status(200).json({
        success: true,
        message: 'Tách đơn thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TableController();
