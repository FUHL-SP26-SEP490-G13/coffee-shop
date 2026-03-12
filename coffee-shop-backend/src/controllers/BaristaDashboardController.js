const service = require("../services/BaristaDashboardService");

class BaristaDashboardController {
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
      const hours = req.query.hours || 6;

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

module.exports = new BaristaDashboardController();
