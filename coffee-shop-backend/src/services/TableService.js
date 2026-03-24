const TableRepository = require("../repositories/TableRepository");
const AreaRepository = require("../repositories/AreaRepository");
const generateQrCode = require('../utils/generateQrCode');
const ErrorResponse = require('../utils/ErrorResponse');

class TableService {
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


}

module.exports = new TableService();
