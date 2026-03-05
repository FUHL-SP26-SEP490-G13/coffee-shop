const bannerRepository = require("../repositories/BannerRepository");

class BannerService {
  async getActive() {
    return bannerRepository.findActive();
  }

  async getAll(params) {
    return bannerRepository.findAll(params);
  }

  async create(data) {
    return bannerRepository.create(data);
  }

  async update(id, data) {
    return bannerRepository.update(id, data);
  }

  async delete(id) {
    return bannerRepository.delete(id);
  }

  async getById(id) {
    return bannerRepository.findById(id);
  }

  async getActiveList() {
    return bannerRepository.findActiveList();
  }
}

module.exports = new BannerService();
