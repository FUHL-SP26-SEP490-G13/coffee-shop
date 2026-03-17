const ToppingService = require('../services/ToppingService');
const response = require('../utils/response');

class ToppingController {
  /**
   * Get all toppings
   * GET /api/toppings
   */
  async getAll(req, res, next) {
    try {
      const toppings = await ToppingService.getAllToppings();

      return response.success(
        res,
        toppings,
        'Lấy danh sách toppings thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topping by ID
   * GET /api/toppings/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const topping = await ToppingService.getToppingById(id);

      return response.success(
        res,
        topping,
        'Lấy thông tin topping thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new topping
   * POST /api/toppings
   */
  async create(req, res, next) {
    try {
      const topping = await ToppingService.createTopping(req.body);

      return response.success(
        res,
        topping,
        'Tạo topping thành công',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update topping
   * PUT /api/toppings/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const topping = await ToppingService.updateTopping(id, req.body);

      return response.success(
        res,
        topping,
        'Cập nhật topping thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete topping
   * DELETE /api/toppings/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ToppingService.deleteTopping(id);

      return response.success(
        res,
        null,
        'Xóa topping thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search toppings
   * GET /api/toppings/search
   */
  async search(req, res, next) {
    try {
      const { keyword, limit, page } = req.query;
      const offset = (page - 1) * limit || 0;

      const toppings = await ToppingService.searchToppings(keyword, {
        limit: parseInt(limit) || 20,
        offset,
      });

      return response.success(
        res,
        toppings,
        'Tìm kiếm toppings thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore deleted topping
   * POST /api/toppings/:id/restore
   */
  async restore(req, res, next) {
    try {
      const { id } = req.params;
      const topping = await ToppingService.restoreTopping(id);

      return response.success(
        res,
        topping,
        'Khôi phục topping thành công'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ToppingController();
