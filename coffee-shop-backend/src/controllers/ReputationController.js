const ReputationService = require("../services/ReputationService");

class ReputationController {
  async getReputationByPhone(req, res, next) {
    try {
      const { phone } = req.query;
      const result = await ReputationService.getReputationByPhone(phone);

      return res.json({
        success: true,
        data: result,
        message: "Lấy điểm uy tín thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminReputationProfiles(req, res, next) {
    try {
      const { page, limit, keyword } = req.query;
      const result = await ReputationService.getAdminReputationProfiles({
        page,
        limit,
        keyword,
      });

      return res.json({
        success: true,
        data: result,
        message: "Lấy danh sách điểm uy tín thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminReputationHistory(req, res, next) {
    try {
      const { phone } = req.params;
      const { limit } = req.query;
      const result = await ReputationService.getAdminReputationHistoryByPhone(
        phone,
        { limit },
      );

      return res.json({
        success: true,
        data: result,
        message: "Lấy lịch sử điểm uy tín thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReputationController();
