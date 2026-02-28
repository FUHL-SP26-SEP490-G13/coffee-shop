const TableService = require('../services/TableService');

class TableController {
  /**
   * Get all tables
   */
  async getAllTables(req, res, next) {
    try {
      const tables = await TableService.getAllTables();
      res.json({
        success: true,
        data: tables,
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
      const table = await TableService.updateTable(req.params.id, req.body);
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
}

module.exports = new TableController();
