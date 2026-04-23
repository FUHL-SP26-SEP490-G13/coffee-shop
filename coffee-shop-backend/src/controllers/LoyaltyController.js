const LoyaltyService = require("../services/LoyaltyService");

class LoyaltyController {
  async getMyLoyalty(req, res, next) {
    try {
      const result = await LoyaltyService.getMyLoyalty(req.user.id);

      return res.json({
        success: true,
        data: result,
        message: "Lấy thông tin điểm loyalty thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactions(req, res, next) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const result = await LoyaltyService.getMyTransactions(req.user.id, {
        page,
        limit,
        type,
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: "Lấy lịch sử điểm loyalty thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async listCustomers(req, res, next) {
    try {
      const { page = 1, limit = 20, keyword = "" } = req.query;
      const result = await LoyaltyService.getCustomerLoyalties({
        page,
        limit,
        keyword,
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: "Lấy danh sách loyalty customer thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerDetail(req, res, next) {
    try {
      const userId = Number(req.params.userId);
      const result = await LoyaltyService.getCustomerLoyaltyDetail(userId);

      return res.json({
        success: true,
        data: result,
        message: "Lấy chi tiết loyalty thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerTransactions(req, res, next) {
    try {
      const userId = Number(req.params.userId);
      const { page = 1, limit = 20, type } = req.query;
      const result = await LoyaltyService.getMyTransactions(userId, {
        page,
        limit,
        type,
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: "Lấy lịch sử loyalty của customer thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustCustomerPoints(req, res, next) {
    try {
      const userId = Number(req.params.userId);
      const { points, source } = req.body;

      const result = await LoyaltyService.adjustPointsByAdmin({
        userId,
        points,
        source,
      });

      return res.json({
        success: true,
        data: result,
        message: "Điều chỉnh điểm loyalty thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LoyaltyController();
