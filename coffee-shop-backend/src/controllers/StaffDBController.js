const service = require("../services/StaffDBService");

class StaffDBController {
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id; // Lấy từ middleware verifyToken
      const data = await service.getOverview(userId);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StaffDBController();
