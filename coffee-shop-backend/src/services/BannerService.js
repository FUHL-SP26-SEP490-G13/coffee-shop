const bannerRepository = require("../repositories/BannerRepository");

class BannerService {
  async getActive() {
    return bannerRepository.findActive();
  }

  async getAll(params) {
    return bannerRepository.findAll(params);
  }

  validateDateRange(start_date, end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Ngày bắt đầu hoặc ngày kết thúc không hợp lệ");
    }

    if (end < start) {
      throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
    }
  }

  async create(data) {
    const existedTitle = await bannerRepository.findByTitle(data.title);

    if (existedTitle) {
      throw new Error("Tiêu đề quảng cáo đã tồn tại");
    }

    this.validateDateRange(data.start_date, data.end_date);

    return bannerRepository.create(data);
  }

  async update(id, data) {
    const existedTitle = await bannerRepository.findByTitleExcludeId(
      data.title,
      id
    );

    if (existedTitle) {
      throw new Error("Tiêu đề quảng cáo đã tồn tại");
    }

    this.validateDateRange(data.start_date, data.end_date);

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
