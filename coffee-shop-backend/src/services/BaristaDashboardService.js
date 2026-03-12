const repository = require("../repositories/BaristaDashboardRepository");

class BaristaDashboardService {
  async getOverview() {
    return repository.getOverview();
  }

  async getOrderTrends(hours) {
    return repository.getOrderTrends(hours);
  }
}

module.exports = new BaristaDashboardService();
