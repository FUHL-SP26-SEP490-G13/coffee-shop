const service = require("../services/BaristaDBService");

class BaristaDBController {
  async getOverview(req, res, next) {
    try {
      const data = await service.getOverview();

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req, res, next) {
    try {
      const hours = parseInt(req.query.hours, 10) || 6;
      const data = await service.getOrderTrends(hours);

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BaristaDBController();
