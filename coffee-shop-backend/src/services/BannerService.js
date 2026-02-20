const bannerRepository = require("../repositories/BannerRepository");

class BannerService {
  async getActive() {
    return bannerRepository.findActive();
  }

  async getAll() {
    return bannerRepository.findAll();
  }

  async create(data) {
    if (data.is_active) {
      await bannerRepository.deactivateAll();
    }
    return bannerRepository.create(data);
  }

  async update(id, data) {
    if (data.is_active) {
      await bannerRepository.deactivateAll();
    }
    return bannerRepository.update(id, data);
  }
}

module.exports = new BannerService();
