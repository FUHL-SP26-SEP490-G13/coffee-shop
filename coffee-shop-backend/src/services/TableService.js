const TableRepository = require("../repositories/TableRepository");
const AreaRepository = require("../repositories/AreaRepository");
const generateQrCode = require('../utils/generateQrCode');
const ErrorResponse = require('../utils/ErrorResponse');
const LoyaltyService = require("./LoyaltyService");

class TableService {
  /**
   * Kiểm tra và reset trạng thái bàn về 'available' nếu tất cả order trong session đã được thanh toán hoặc huỷ.
   */
  async checkAndResetTableStatus(connection, tableId, sessionId) {
    if (!tableId || !sessionId) return;

    const [remainingUnpaid] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM orders o
       LEFT JOIN order_payments op ON op.order_id = o.id
       WHERE o.table_id = ? AND o.session_id = ?
         AND o.status NOT IN ('cancelled')
         AND (o.is_paid = 0 OR COALESCE(op.payment_status,'pending') != 'paid')`,
      [tableId, sessionId]
    );

    if (Number(remainingUnpaid[0]?.cnt || 0) === 0) {
      await connection.query(
        "UPDATE tables SET status = 'available', current_session_id = NULL WHERE id = ?",
        [tableId]
      );
    }
  }

  buildToppingSignature(toppings = []) {
    if (!Array.isArray(toppings) || toppings.length === 0) return "";
    return toppings
      .map((t) => `${Number(t.topping_id)}:${Number(t.quantity || 0)}:${Number(t.price || 0)}`)
      .sort()
      .join("|");
  }

  buildOrderDetailSignature(detail) {
    return [
      Number(detail.product_id || 0),
      Number(detail.product_size_id || 0),
      Number(detail.price || 0),
      String(detail.note || "").trim(),
      this.buildToppingSignature(detail.toppings || []),
    ].join("#");
  }

  async loadOrderDetailsForMerge(connection, orderId) {
    const [rows] = await connection.query(
      `
      SELECT
        od.id,
        od.product_size_id,
        ps.product_id,
        od.quantity,
        od.price,
        COALESCE(od.note, '') AS note
      FROM order_details od
      JOIN product_sizes ps ON ps.id = od.product_size_id
      WHERE od.order_id = ?
      ORDER BY od.id ASC
      `,
      [orderId]
    );

    if (rows.length === 0) return [];

    const detailIds = rows.map((r) => r.id);
    const placeholders = detailIds.map(() => "?").join(",");
    const [toppings] = await connection.query(
      `
      SELECT
        order_detail_id,
        topping_id,
        quantity,
        price
      FROM order_detail_toppings
      WHERE order_detail_id IN (${placeholders})
      ORDER BY order_detail_id ASC, topping_id ASC, quantity ASC, price ASC
      `,
      detailIds
    );

    const toppingsByDetail = new Map();
    toppings.forEach((t) => {
      const key = Number(t.order_detail_id);
      if (!toppingsByDetail.has(key)) toppingsByDetail.set(key, []);
      toppingsByDetail.get(key).push({
        topping_id: Number(t.topping_id),
        quantity: Number(t.quantity || 0),
        price: Number(t.price || 0),
      });
    });

    return rows.map((r) => ({
      id: Number(r.id),
      product_size_id: Number(r.product_size_id),
      product_id: Number(r.product_id),
      quantity: Number(r.quantity || 0),
      price: Number(r.price || 0),
      note: String(r.note || ""),
      toppings: toppingsByDetail.get(Number(r.id)) || [],
    }));
  }

  async recalculateOrderTotal(connection, orderId) {
    const [rows] = await connection.query(
      `
      SELECT
        COALESCE(SUM((od.price + COALESCE(t.topping_total, 0)) * od.quantity), 0) AS total
      FROM order_details od
      LEFT JOIN (
        SELECT order_detail_id, COALESCE(SUM(price * quantity), 0) AS topping_total
        FROM order_detail_toppings
        GROUP BY order_detail_id
      ) t ON t.order_detail_id = od.id
      WHERE od.order_id = ?
      `,
      [orderId]
    );
    return Number(rows[0]?.total || 0);
  }

  /**
   * Get all tables with area information
   */
  async getAllTables(options = {}) {
    let query = `
      SELECT t.*, a.name as area_name 
      FROM tables t
      JOIN area a ON t.area_id = a.id
      WHERE t.is_deleted = 0
    `;
    const params = [];

    if (options.status && options.status !== "all") {
      query += ` AND t.status = ?`;
      params.push(options.status);
    }

    query += ` ORDER BY a.name ASC, t.code ASC`;

    const [rows] = await TableRepository.db.query(query, params);
    return rows;
  }

  /**
   * Get table by ID
   */
  async getTableById(id) {
    const table = await TableRepository.findById(id);
    if (!table || table.is_deleted) {
      throw new ErrorResponse(404, 'Bàn không tồn tại');
    }
    return table;
  }
  // timc cac order chua thanh toan cua ban theo session_id hien tai
  async getUnpaidOrders(tableId) {
    const table = await TableRepository.findById(tableId);
    if (!table || !table.current_session_id) {
      return [];
    }

    const [rows] = await TableRepository.db.query(
      `
      SELECT
        o.id,
        o.total_amount,
        o.is_paid,
        o.status AS order_status,
        o.created_at,
        COALESCE(op.payment_status, 'pending') AS payment_status
      FROM orders o
      LEFT JOIN order_payments op ON op.order_id = o.id
      WHERE o.table_id = ?
        AND o.session_id = ?
        AND o.status NOT IN ('cancelled')
      ORDER BY o.created_at ASC
      `,
      [tableId, table.current_session_id]
    );

    // Filter only unpaid orders
    return rows.filter((order) => {
      const paidByFlag = Number(order.is_paid || 0) === 1;
      const paidByStatus = String(order.payment_status || '').toLowerCase() === 'paid';
      return !(paidByFlag || paidByStatus);
    });
  }

  /**
   * Create new table
   */
  async createTable(data) {
    // Check if area exists
    const area = await AreaRepository.findById(data.area_id);
    if (!area) {
      throw new ErrorResponse(404, 'Khu vực không tồn tại');
    }

    // Auto-generate table code
    const lastTableQuery =
      'SELECT code FROM tables WHERE code LIKE "TB-%" AND is_deleted = 0 ORDER BY CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC LIMIT 1';
    const [lastTable] = await TableRepository.db.query(lastTableQuery);
    let newCode = "TB-01";
    if (lastTable.length > 0 && lastTable[0].code) {
      const match = lastTable[0].code.match(/TB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        newCode = `TB-${num.toString().padStart(2, "0")}`;
      }
    }

    return await TableRepository.create({
      code: newCode,
      seatNumber: data.seatNumber || 4,
      area_id: data.area_id,
      status: "available",
      is_deleted: 0,
    });
  }

  /**
   * Update table
   */
  async updateTable(id, data) {
    const table = await this.getTableById(id);

    if (data.area_id) {
      const area = await AreaRepository.findById(data.area_id);
      if (!area) {
        throw new ErrorResponse(404, 'Khu vực không tồn tại');
      }
    }

    if (data.status === 'available') {
      data.current_session_id = null;

      const [affectedOrders] = await TableRepository.db.query(
        `
        SELECT id
        FROM orders
        WHERE table_id = ?
          AND status IN ('pending', 'processing')
        `,
        [id]
      );

      // Mark all pending/processing orders for this table as completed
      await TableRepository.db.query(
        "UPDATE orders SET status = 'completed' WHERE table_id = ? AND status IN ('pending', 'processing')",
        [id]
      );

      for (const order of affectedOrders) {
        await LoyaltyService.syncOrderLoyaltyByOrderId(order.id);
      }
    }

    return await TableRepository.update(id, data);
  }

  /**
   * Soft delete table
   */
  async deleteTable(id) {
    const table = await this.getTableById(id);
    if (table.code) {
      await TableRepository.update(id, { code: `${table.code}-del-${id}` });
    }
    return await TableRepository.softDelete(id);
  }

  /**
   * Get tables by area ID
   */
  async getTablesByArea(areaId) {
    return await TableRepository.findByAreaId(areaId);
  }

  /**
 * Tạo mới bàn và sinh QR code (base64)
 * @param {object} data - { name, seatNumber, area_id, status }
 * @returns {Promise<object>} - Bản ghi bàn vừa tạo
 */
  async createTableWithQrCode(data) {
    // Validate area tồn tại
    const area = await AreaRepository.findById(data.area_id);
    if (!area) throw new Error('Khu vực không tồn tại');

    // Sinh code tự động dạng TB-01, TB-02...
    const lastTableQuery =
      'SELECT code FROM tables WHERE code LIKE "TB-%" AND is_deleted = 0 ORDER BY CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC LIMIT 1';
    const [lastTable] = await TableRepository.db.query(lastTableQuery);
    let newCode = "TB-01";
    if (lastTable.length > 0 && lastTable[0].code) {
      const match = lastTable[0].code.match(/TB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        newCode = `TB-${num.toString().padStart(2, "0")}`;
      }
    }

    const seatNumber = data.seatNumber || 4;
    const status = data.status || 'available';
    const [result] = await TableRepository.db.query(
      'INSERT INTO tables (code, seatNumber, area_id, status, is_deleted) VALUES (?, ?, ?, ?, 0)',
      [newCode, seatNumber, data.area_id, status]
    );
    const tableId = result.insertId;

    // Tạo URL QR code
    const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/order?table=${tableId}`;
    const qrBase64 = await generateQrCode(url);

    // Update lại trường qrUrl
    await TableRepository.updateQrForTable(tableId, qrBase64);

    // Trả về bản ghi bàn đã có qrUrl
    const [rows] = await TableRepository.db.query('SELECT * FROM tables WHERE id = ?', [tableId]);
    return rows[0];
  }


  /**
   * Cập nhật QR code (base64) cho bàn đã có sẵn
   * @param {number} tableId
   * @returns {Promise<object>} - Bản ghi bàn sau khi cập nhật
   */
  async updateQrForTable(tableId) {
    // Lấy thông tin bàn
    const table = await this.getTableById(tableId);
    if (!table) throw new Error('Bàn không tồn tại');
    // Tạo URL QR code (có thể sửa lại domain cho đúng frontend)
    const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/order?table=${table.id}`;
    // Sinh QR code base64
    const generateQrCode = require('../utils/generateQrCode');
    const qrBase64 = await generateQrCode(url);
    // Cập nhật vào DB
    const updatedTable = await TableRepository.updateQrForTable(tableId, qrBase64);
    return updatedTable;
  }

  /**
   * Chuyển bàn: di chuyển toàn bộ đơn hàng từ bàn nguồn sang bàn đích
   * @param {number} fromTableId - ID bàn nguồn (đang có khách)
   * @param {number} toTableId   - ID bàn đích (phải trống)
   */
  async transferTable(fromTableId, toTableId) {
    const connection = await TableRepository.db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra bàn nguồn
      const [fromRows] = await connection.query(
        'SELECT id, code, status, current_session_id FROM tables WHERE id = ? AND is_deleted = 0',
        [fromTableId]
      );
      if (fromRows.length === 0) throw new ErrorResponse(404, 'Bàn nguồn không tồn tại');
      const fromTable = fromRows[0];
      if (fromTable.status !== 'occupied') {
        throw new ErrorResponse(400, `Bàn ${fromTable.code} không có khách để chuyển`);
      }

      // 2. Kiểm tra bàn đích
      const [toRows] = await connection.query(
        'SELECT id, code, status FROM tables WHERE id = ? AND is_deleted = 0',
        [toTableId]
      );
      if (toRows.length === 0) throw new ErrorResponse(404, 'Bàn đích không tồn tại');
      const toTable = toRows[0];
      if (toTable.status !== 'available') {
        throw new ErrorResponse(400, `Bàn ${toTable.code} hiện không trống, không thể chuyển`);
      }

      // 3. Tạo session mới cho bàn đích
      const oldSessionId = fromTable.current_session_id;
      const newSessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // 4. Chuyển tất cả orders thuộc session cũ sang bàn đích
      if (oldSessionId) {
        await connection.query(
          'UPDATE orders SET table_id = ?, session_id = ? WHERE table_id = ? AND session_id = ?',
          [toTableId, newSessionId, fromTableId, oldSessionId]
        );
      }

      // 5. Bàn nguồn → trống
      await connection.query(
        "UPDATE tables SET status = 'available', current_session_id = NULL WHERE id = ?",
        [fromTableId]
      );

      // 6. Bàn đích → có khách với session mới
      await connection.query(
        "UPDATE tables SET status = 'occupied', current_session_id = ? WHERE id = ?",
        [newSessionId, toTableId]
      );

      await connection.commit();

      return {
        from: { id: fromTableId, code: fromTable.code },
        to: { id: toTableId, code: toTable.code },
        new_session_id: newSessionId,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Thanh toán công nợ cho bàn theo session hiện tại.
   * Chỉ thanh toán các order chưa paid, không cộng các order đã thanh toán trước đó.
   */
  async settleTableDebt(tableId, { payment_method = 'cash', cash_received = null, order_ids = null } = {}) {
    const method = String(payment_method || 'cash').toLowerCase();
    if (!['cash', 'payos'].includes(method)) {
      throw new ErrorResponse(400, 'Phương thức thanh toán không hợp lệ');
    }

    const connection = await TableRepository.db.getConnection();
    try {
      await connection.beginTransaction();

      const [tableRows] = await connection.query(
        'SELECT id, code, current_session_id FROM tables WHERE id = ? AND is_deleted = 0 LIMIT 1',
        [tableId]
      );
      if (tableRows.length === 0) {
        throw new ErrorResponse(404, 'Bàn không tồn tại');
      }

      const table = tableRows[0];
      if (!table.current_session_id) {
        throw new ErrorResponse(400, `Bàn ${table.code} chưa có phiên phục vụ`);
      }

      const [debtOrders] = await connection.query(
        `
        SELECT
          o.id,
          o.total_amount,
          o.is_paid,
          COALESCE(op.payment_status, 'pending') AS payment_status
        FROM orders o
        LEFT JOIN order_payments op ON op.order_id = o.id
        WHERE o.table_id = ?
          AND o.session_id = ?
          AND o.status NOT IN ('cancelled')
          AND o.total_amount > 0
        ORDER BY o.created_at ASC
        `,
        [tableId, table.current_session_id]
      );

      if (debtOrders.length === 0) {
        throw new ErrorResponse(404, 'Không có đơn hàng nào để thanh toán');
      }

      let unpaidOrders = debtOrders.filter((order) => {
        const paidByFlag = Number(order.is_paid || 0) === 1;
        const paidByStatus = String(order.payment_status || '').toLowerCase() === 'paid';
        return !(paidByFlag || paidByStatus);
      });

      // Nếu có danh sách `order_ids` truyền lên, chỉ thanh toán các đơn đó
      if (order_ids && Array.isArray(order_ids) && order_ids.length > 0) {
        const selectedIds = order_ids.map(Number);
        unpaidOrders = unpaidOrders.filter((o) => selectedIds.includes(Number(o.id)));
      }

      if (unpaidOrders.length === 0) {
        throw new ErrorResponse(400, `Bàn ${table.code} không có đơn hàng phù hợp để thanh toán`);
      }


      const debtAmount = unpaidOrders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      );

      if (method === 'cash' && cash_received !== null && cash_received !== undefined) {
        const received = Number(cash_received);
        if (Number.isNaN(received) || received < debtAmount) {
          throw new ErrorResponse(400, 'Tiền khách đưa không đủ để thanh toán công nợ');
        }
      }

      const orderIds = unpaidOrders.map((o) => Number(o.id));
      const placeholders = orderIds.map(() => '?').join(',');

      await connection.query(
        `UPDATE orders SET is_paid = 1, paid_at = NOW() WHERE id IN (${placeholders})`,
        orderIds
      );

      // Upsert order_payments: insert if missing (e.g. split orders), update if existing
      for (const oid of orderIds) {
        const orderTotal = unpaidOrders.find(o => Number(o.id) === oid)?.total_amount || 0;
        await connection.query(
          `INSERT INTO order_payments (order_id, payment_method, payment_status, amount, paid_at)
           VALUES (?, ?, 'paid', ?, NOW())
           ON DUPLICATE KEY UPDATE payment_status = 'paid', payment_method = ?, paid_at = NOW()`,
          [oid, method, orderTotal, method]
        );
      }

      // Reset trang thai ban cong no sau khi thanh toan
      await this.checkAndResetTableStatus(connection, tableId, table.current_session_id);

      await connection.commit();

      return {
        table_id: Number(tableId),
        table_code: table.code,
        settled_orders: orderIds.length,
        debt_amount: debtAmount,
        payment_method: method,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Merge active orders from source table into destination table.
   */
  async mergeOrder(fromTableId, toTableId) {
    if (Number(fromTableId) === Number(toTableId)) {
      throw new ErrorResponse(400, 'Không thể gộp order vào chính nó');
    }

    const connection = await TableRepository.db.getConnection();
    try {
      await connection.beginTransaction();

      const [tableRows] = await connection.query(
        `
        SELECT id, code, status, current_session_id
        FROM tables
        WHERE id IN (?, ?) AND is_deleted = 0
        FOR UPDATE
        `,
        [fromTableId, toTableId]
      );

      const fromTable = tableRows.find((t) => Number(t.id) === Number(fromTableId));
      const toTable = tableRows.find((t) => Number(t.id) === Number(toTableId));

      if (!fromTable) throw new ErrorResponse(404, 'Bàn nguồn không tồn tại');
      if (!toTable) throw new ErrorResponse(404, 'Bàn đích không tồn tại');

      if (!fromTable.current_session_id) {
        throw new ErrorResponse(400, `Bàn ${fromTable.code} không có order active`);
      }

      const [sourceOrders] = await connection.query(
        `
        SELECT
          o.id,
          o.table_id,
          o.session_id,
          o.status,
          o.is_paid,
          o.total_amount,
          o.created_at,
          COALESCE(op.payment_status, 'pending') AS payment_status
        FROM orders o
        LEFT JOIN order_payments op ON op.order_id = o.id
        WHERE o.table_id = ?
          AND o.session_id = ?
          AND o.status IN ('pending', 'preparing', 'processing')
        ORDER BY o.created_at ASC
        FOR UPDATE
        `,
        [fromTableId, fromTable.current_session_id]
      );

      if (sourceOrders.length === 0) {
        throw new ErrorResponse(400, `Bàn ${fromTable.code} không có order active`);
      }

      const invalidSource = sourceOrders.find(
        (o) => Number(o.is_paid || 0) === 1 || String(o.payment_status || '').toLowerCase() === 'paid'
      );
      if (invalidSource) {
        throw new ErrorResponse(400, 'Không thể merge khi order nguồn đã thanh toán');
      }

      let destinationSession = toTable.current_session_id;
      const destinationOrdersQuery = destinationSession
        ? `
          SELECT
            o.id,
            o.table_id,
            o.session_id,
            o.status,
            o.is_paid,
            o.total_amount,
            o.created_at,
            COALESCE(op.payment_status, 'pending') AS payment_status
          FROM orders o
          LEFT JOIN order_payments op ON op.order_id = o.id
          WHERE o.table_id = ?
            AND o.session_id = ?
            AND o.status IN ('pending', 'preparing', 'processing')
          ORDER BY o.created_at ASC
          FOR UPDATE
        `
        : `
          SELECT
            o.id,
            o.table_id,
            o.session_id,
            o.status,
            o.is_paid,
            o.total_amount,
            o.created_at,
            COALESCE(op.payment_status, 'pending') AS payment_status
          FROM orders o
          LEFT JOIN order_payments op ON op.order_id = o.id
          WHERE o.table_id = ?
            AND o.status IN ('pending', 'preparing', 'processing')
          ORDER BY o.created_at ASC
          FOR UPDATE
        `;
      const destinationParams = destinationSession ? [toTableId, destinationSession] : [toTableId];
      const [destinationOrders] = await connection.query(destinationOrdersQuery, destinationParams);

      const invalidDestination = destinationOrders.find(
        (o) => Number(o.is_paid || 0) === 1 || String(o.payment_status || '').toLowerCase() === 'paid'
      );
      if (invalidDestination) {
        throw new ErrorResponse(400, 'Không thể merge khi order đích đã thanh toán');
      }

      if (destinationOrders.length === 0) {
        destinationSession = destinationSession || `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const sourceOrderIds = sourceOrders.map((o) => Number(o.id));
        const placeholders = sourceOrderIds.map(() => '?').join(',');

        await connection.query(
          `
          UPDATE orders
          SET table_id = ?, session_id = ?
          WHERE id IN (${placeholders})
          `,
          [toTableId, destinationSession, ...sourceOrderIds]
        );

        await connection.query(
          "UPDATE tables SET status = 'available', current_session_id = NULL WHERE id = ?",
          [fromTableId]
        );
        await connection.query(
          "UPDATE tables SET status = 'occupied', current_session_id = ? WHERE id = ?",
          [destinationSession, toTableId]
        );

        await connection.commit();
        return {
          merged: true,
          merged_into_order_id: null,
          source_closed_orders: sourceOrderIds.length,
          moved_orders: sourceOrderIds.length,
          from: { id: fromTable.id, code: fromTable.code },
          to: { id: toTable.id, code: toTable.code },
          mode: 'move-all',
        };
      }

      const keeperOrder = destinationOrders[0];
      const keeperOrderId = Number(keeperOrder.id);
      const keeperDetails = await this.loadOrderDetailsForMerge(connection, keeperOrderId);
      const keeperBySignature = new Map();

      keeperDetails.forEach((detail) => {
        const signature = this.buildOrderDetailSignature(detail);
        if (!keeperBySignature.has(signature)) {
          keeperBySignature.set(signature, detail);
        }
      });

      for (const sourceOrder of sourceOrders) {
        const sourceDetails = await this.loadOrderDetailsForMerge(connection, Number(sourceOrder.id));

        for (const detail of sourceDetails) {
          const signature = this.buildOrderDetailSignature(detail);
          const existed = keeperBySignature.get(signature);

          if (existed) {
            await connection.query(
              'UPDATE order_details SET quantity = quantity + ? WHERE id = ?',
              [Number(detail.quantity || 0), Number(existed.id)]
            );
          } else {
            const [insertDetail] = await connection.query(
              `
              INSERT INTO order_details (order_id, product_size_id, quantity, price, note)
              VALUES (?, ?, ?, ?, ?)
              `,
              [
                keeperOrderId,
                Number(detail.product_size_id),
                Number(detail.quantity || 0),
                Number(detail.price || 0),
                String(detail.note || ''),
              ]
            );

            const newDetailId = Number(insertDetail.insertId);
            if (Array.isArray(detail.toppings) && detail.toppings.length > 0) {
              for (const topping of detail.toppings) {
                await connection.query(
                  `
                  INSERT INTO order_detail_toppings (order_detail_id, topping_id, quantity, price)
                  VALUES (?, ?, ?, ?)
                  `,
                  [
                    newDetailId,
                    Number(topping.topping_id),
                    Number(topping.quantity || 0),
                    Number(topping.price || 0),
                  ]
                );
              }
            }

            keeperBySignature.set(signature, {
              ...detail,
              id: newDetailId,
            });
          }
        }
      }

      const sourceOrderIds = sourceOrders.map((o) => Number(o.id));
      const sourcePlaceholders = sourceOrderIds.map(() => '?').join(',');

      await connection.query(
        `
        UPDATE orders
        SET status = 'cancelled', total_amount = 0
        WHERE id IN (${sourcePlaceholders})
        `,
        sourceOrderIds
      );

      const keeperTotal = await this.recalculateOrderTotal(connection, keeperOrderId);
      await connection.query(
        'UPDATE orders SET total_amount = ? WHERE id = ?',
        [keeperTotal, keeperOrderId]
      );
      await connection.query(
        'UPDATE order_payments SET amount = ? WHERE order_id = ?',
        [keeperTotal, keeperOrderId]
      );

      await connection.query(
        "UPDATE tables SET status = 'available', current_session_id = NULL WHERE id = ?",
        [fromTableId]
      );
      await connection.query(
        "UPDATE tables SET status = 'occupied', current_session_id = ? WHERE id = ?",
        [keeperOrder.session_id || destinationSession || toTable.current_session_id, toTableId]
      );

      await connection.commit();
      return {
        merged: true,
        merged_into_order_id: keeperOrderId,
        source_closed_orders: sourceOrderIds.length,
        from: { id: fromTable.id, code: fromTable.code },
        to: { id: toTable.id, code: toTable.code },
        mode: 'merge-items',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * Tách hóa đơn từ bàn hiện tại (Tạo order mới)
   */
  async splitBill(tableId, items) {
    if (!items || !items.length) {
      throw new ErrorResponse(400, 'Không có món nào để tách');
    }

    const connection = await TableRepository.db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get Table
      const [tableRows] = await connection.query(
        'SELECT id, code, current_session_id FROM tables WHERE id = ? AND is_deleted = 0 FOR UPDATE',
        [tableId]
      );
      if (tableRows.length === 0) throw new ErrorResponse(404, 'Bàn không tồn tại');
      const table = tableRows[0];
      if (!table.current_session_id) throw new ErrorResponse(400, 'Bàn chưa có order nào');

      // 2. Lấy tất cả các order chưa thanh toán của session này
      const [sourceOrders] = await connection.query(
        `
        SELECT o.id, o.is_paid, o.status, COALESCE(op.payment_status, 'pending') AS payment_status
        FROM orders o
        LEFT JOIN order_payments op ON op.order_id = o.id
        WHERE o.table_id = ? AND o.session_id = ? AND o.status IN ('pending', 'processing')
        FOR UPDATE
        `,
        [tableId, table.current_session_id]
      );

      const unpaidOrders = sourceOrders.filter(
        o => Number(o.is_paid || 0) !== 1 && String(o.payment_status || '').toLowerCase() !== 'paid'
      );
      if (unpaidOrders.length === 0) throw new ErrorResponse(400, 'Không có đơn hàng nào chưa thanh toán để tách');
      const orderIds = unpaidOrders.map(o => Number(o.id));

      // 3. Lấy tất cả order details của các order trên
      const placeholders = orderIds.map(() => '?').join(',');
      const [allDetails] = await connection.query(
        `
        SELECT id, order_id, product_size_id, quantity, price, COALESCE(note, '') AS note
        FROM order_details
        WHERE order_id IN (${placeholders})
        FOR UPDATE
        `,
        orderIds
      );

      // 4. Tạo order mới (Tách), dùng session_id của bàn để có thể settle cùng
      const [insertOrder] = await connection.query(
        `
        INSERT INTO orders (user_id, created_by, customer_type, order_type, table_id, status, is_paid, total_amount, session_id)
        VALUES (1, 1, 'guest', 'dine-in', ?, 'pending', 0, 0, ?)
        `,
        [tableId, table.current_session_id]
      );
      const newOrderId = Number(insertOrder.insertId);

      let splitTotal = 0;
      const modifiedOrderIds = new Set();

      for (const reqItem of items) {
        const detailId = Number(reqItem.order_detail_id);
        const splitQty = Number(reqItem.quantity);
        if (!splitQty || splitQty <= 0) continue;

        const originalDetail = allDetails.find(d => Number(d.id) === detailId);
        if (!originalDetail) throw new ErrorResponse(400, `Item ${detailId} không tồn tại trong hóa đơn hiện tại`);
        if (splitQty > originalDetail.quantity) throw new ErrorResponse(400, `Số lượng tách (${splitQty}) lớn hơn số lượng hiện có (${originalDetail.quantity})`);

        // Load toppings
        const [toppings] = await connection.query(
          'SELECT id, topping_id, quantity, price FROM order_detail_toppings WHERE order_detail_id = ? FOR UPDATE',
          [detailId]
        );

        // Tạo order detail cho order mới
        const [insertDetail] = await connection.query(
          `
          INSERT INTO order_details (order_id, product_size_id, quantity, price, note)
          VALUES (?, ?, ?, ?, ?)
          `,
          [newOrderId, originalDetail.product_size_id, splitQty, originalDetail.price, originalDetail.note]
        );
        const newDetailId = Number(insertDetail.insertId);

        let toppingTotalForSplit = 0;

        for (const t of toppings) {
          const splitToppingQty = Math.floor((t.quantity * splitQty) / originalDetail.quantity);
          if (splitToppingQty > 0) {
            await connection.query(
              `INSERT INTO order_detail_toppings (order_detail_id, topping_id, quantity, price) VALUES (?, ?, ?, ?)`,
              [newDetailId, t.topping_id, splitToppingQty, t.price]
            );
            toppingTotalForSplit += splitToppingQty * t.price;

            const remainingToppingQty = t.quantity - splitToppingQty;
            if (remainingToppingQty > 0) {
              await connection.query('UPDATE order_detail_toppings SET quantity = ? WHERE id = ?', [remainingToppingQty, t.id]);
            } else {
              await connection.query('DELETE FROM order_detail_toppings WHERE id = ?', [t.id]);
            }
          }
        }

        splitTotal += (splitQty * originalDetail.price) + toppingTotalForSplit;

        // Trừ số lượng ở order detail gốc
        const remainingQty = originalDetail.quantity - splitQty;
        if (remainingQty > 0) {
          await connection.query('UPDATE order_details SET quantity = ? WHERE id = ?', [remainingQty, detailId]);
        } else {
          await connection.query('DELETE FROM order_details WHERE id = ?', [detailId]);
        }
        modifiedOrderIds.add(originalDetail.order_id);
      }

      if (splitTotal === 0) throw new ErrorResponse(400, 'Không tách được sản phẩm nào');

      // Cập nhật lại tổng tiền order mới (để trạng thái pending, chưa thanh toán)
      await connection.query(
        'UPDATE orders SET total_amount = ?, is_paid = 0, status = "pending" WHERE id = ?',
        [splitTotal, newOrderId]
      );

      // (Đã loại bỏ phần tự động tạo order_payments và đánh dấu đã thanh toán)

      // Tính lại tổng tiền order gốc
      for (const oId of modifiedOrderIds) {
        const remainingTotal = await this.recalculateOrderTotal(connection, oId);
        if (remainingTotal > 0) {
          await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [remainingTotal, oId]);
        } else {
          await connection.query('UPDATE orders SET status = "cancelled", total_amount = 0 WHERE id = ?', [oId]);
        }
      }

      // (Đã loại bỏ checkAndResetTableStatus vì đơn mới tách chưa được thanh toán)


      await connection.commit();
      return {
        table_id: tableId,
        new_order_id: newOrderId,
        split_total: splitTotal
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new TableService();
