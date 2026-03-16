const TableRepository = require('../repositories/TableRepository');
const AreaRepository = require('../repositories/AreaRepository');
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
    
    if (options.status && options.status !== 'all') {
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
    const lastTableQuery = 'SELECT code FROM tables WHERE code LIKE "TB-%" AND is_deleted = 0 ORDER BY CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC LIMIT 1';
    const [lastTable] = await TableRepository.db.query(lastTableQuery);
    let newCode = 'TB-01';
    if (lastTable.length > 0 && lastTable[0].code) {
      const match = lastTable[0].code.match(/TB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        newCode = `TB-${num.toString().padStart(2, '0')}`;
      }
    }

    return await TableRepository.create({
      code: newCode,
      seatNumber: data.seatNumber || 4,
      area_id: data.area_id,
      status: 'available',
      is_deleted: 0
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
}

module.exports = new TableService();
