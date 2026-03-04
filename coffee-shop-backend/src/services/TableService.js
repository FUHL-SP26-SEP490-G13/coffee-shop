const TableRepository = require('../repositories/TableRepository');
const AreaRepository = require('../repositories/AreaRepository');

class TableService {
  /**
   * Get all tables with area information
   */
  async getAllTables() {
    const query = `
      SELECT t.*, a.name as area_name 
      FROM tables t
      JOIN area a ON t.area_id = a.id
      WHERE t.is_deleted = 0
      ORDER BY a.name ASC, t.table_number ASC
    `;
    const [rows] = await TableRepository.db.query(query);
    return rows;
  }

  /**
   * Get table by ID
   */
  async getTableById(id) {
    const table = await TableRepository.findById(id);
    if (!table || table.is_deleted) {
      throw new Error('Bàn không tồn tại');
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
      throw new Error('Khu vực không tồn tại');
    }

    // Check if table number already exists in this area
    const exists = await TableRepository.existsInArea(data.table_number, data.area_id);
    if (exists) {
      throw new Error(`Bàn số ${data.table_number} đã tồn tại trong khu vực này`);
    }

    return await TableRepository.create({
      table_number: data.table_number,
      area_id: data.area_id,
      status: data.status || 'available',
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
        throw new Error('Khu vực không tồn tại');
      }
    }

    // If changing table number or area, check for uniqueness
    if ((data.table_number && data.table_number !== table.table_number) || 
        (data.area_id && data.area_id.toString() !== table.area_id.toString())) {
      const targetNumber = data.table_number || table.table_number;
      const targetAreaId = data.area_id || table.area_id;
      
      const exists = await TableRepository.existsInArea(targetNumber, targetAreaId, id);
      if (exists) {
        throw new Error(`Bàn số ${targetNumber} đã tồn tại trong khu vực này`);
      }
    }

    return await TableRepository.update(id, data);
  }

  /**
   * Soft delete table
   */
  async deleteTable(id) {
    await this.getTableById(id);
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
