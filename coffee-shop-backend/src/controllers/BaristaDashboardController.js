const service = require("../services/BaristaDashboardService");

class BaristaDashboardController {
  async getOverview(req, res) {
    try {
      const data = await service.getOverview();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  async getTrends(req, res) {
    try {
      const hours = req.query.hours || 6;
      const data = await service.getOrderTrends(hours);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  }
}

module.exports = new BaristaDashboardController();
