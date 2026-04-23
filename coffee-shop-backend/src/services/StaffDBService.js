const repository = require("../repositories/StaffDBRepository");

class StaffDBService {
  async getOverview(userId) {
    return repository.getOverview(userId);
  }
}

module.exports = new StaffDBService();
