const TableService = require('../services/TableService');
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
}

module.exports = new TableController();
