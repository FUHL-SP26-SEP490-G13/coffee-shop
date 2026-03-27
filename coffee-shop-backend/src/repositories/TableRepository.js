const BaseRepository = require("./BaseRepository");
const db = require("../config/database");

class TableRepository extends BaseRepository {
  constructor() {
    super("tables");
  }

  /**
   * Find tables by area ID
   */
  async findByAreaId(areaId) {
    return await this.findAll(
      { area_id: areaId },
      { orderBy: "code", order: "ASC" },
    );
  }

    /**
   * Tìm bàn theo ID
   */
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM tables WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Tạo mới bàn
   */
  async create(data) {
    const { code, seatNumber, area_id, status, is_deleted } = data;
    const [result] = await db.query(
      'INSERT INTO tables (code, seatNumber, area_id, status, is_deleted) VALUES (?, ?, ?, ?, ?)',
      [code, seatNumber, area_id, status, is_deleted]
    );
    const tableId = result.insertId;
    const [rows] = await db.query('SELECT * FROM tables WHERE id = ?', [tableId]);
    return rows[0];
  }

  /**
   * Cập nhật bàn
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
    if (fields.length === 0) return await this.findById(id);
    const sql = `UPDATE tables SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.query(sql, values);
    return await this.findById(id);
  }

  /**
   * Xóa mềm bàn
   */
  async softDelete(id) {
    await db.query('UPDATE tables SET is_deleted = 1 WHERE id = ?', [id]);
    return await this.findById(id);
  }

    /**
     * Cập nhật QR code (base64) cho bàn đã có sẵn
     * @param {number} tableId - ID của bàn
     * @param {string} qrBase64 - Ảnh QR code base64
     * @returns {Promise<object>} - Bản ghi bàn sau khi cập nhật
     */
    async updateQrForTable(tableId, qrBase64) {
      const updateQuery = `
        UPDATE tables
        SET qrUrl = ?
        WHERE id = ?
      `;
      await db.query(updateQuery, [qrBase64, tableId]);

      const selectQuery = `
        SELECT * FROM tables
        WHERE id = ?
      `;
      const [rows] = await db.query(selectQuery, [tableId]);
      return rows[0];
    }
  
    
  /**
   * Tạo mới bàn với QR code (base64)
   * @param {string} name
   * @param {string} qrUrl (base64)
   * @returns {Promise<object>} - Bản ghi bàn vừa tạo
   */
  async createTableWithQrCode(name, qrUrl) {
    const insertQuery = `
      INSERT INTO tables (name, qrUrl)
      VALUES (?, ?)
    `;
    const [result] = await db.query(insertQuery, [name, qrUrl]);
    const tableId = result.insertId;

    const selectQuery = `
      SELECT * FROM tables
      WHERE id = ?
    `;
    const [rows] = await db.query(selectQuery, [tableId]);
    return rows[0];
  }



}

module.exports = new TableRepository();
