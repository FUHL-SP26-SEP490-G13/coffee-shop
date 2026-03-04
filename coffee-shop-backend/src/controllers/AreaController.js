const AreaService = require('../services/AreaService');
const response = require('../utils/response');

class AreaController {
  /**
   * Get all area
   * GET /api/area
   */
  async getAll(req, res, next) {
    try {
      const area = await AreaService.getAllAreas();
      return response.success(res, area, 'Lấy danh sách khu vực thành công');
    } catch (error) {

      next(error);
    }
  }

  /**
   * Get area by ID
   * GET /api/area/:id

   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const area = await AreaService.getAreaById(id);
      return response.success(res, area, 'Lấy thông tin khu vực thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new area
   * POST /api/area

   */
  async create(req, res, next) {
    try {
      const area = await AreaService.createArea(req.body);
      return response.success(res, area, 'Tạo khu vực thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update area
   * PUT /api/area/:id

   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const area = await AreaService.updateArea(id, req.body);
      return response.success(res, area, 'Cập nhật khu vực thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete area
   * DELETE /api/area/:id

   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await AreaService.deleteArea(id);
      return response.success(res, null, 'Xóa khu vực thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AreaController();
