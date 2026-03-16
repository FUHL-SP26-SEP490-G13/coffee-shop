const repository = require("../repositories/BaristaDBRepository");

class BaristaDBService {
  async getOverview() {
    return repository.getOverview();
  }

  async getOrderTrends(hours) {
    return repository.getOrderTrends(hours);
  }
}

module.exports = new BaristaDBService();
