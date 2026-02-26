const bannerRepository = require("../repositories/BannerRepository");

class BannerService {
  async getActive() {
    return bannerRepository.findActive();
  }

  async getAll(params) {
    return bannerRepository.findAll(params);
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

  async delete(id) {
    return bannerRepository.delete(id);
  }

  async getById(id) {
    return bannerRepository.findById(id);
  }
}

module.exports = new BannerService();
