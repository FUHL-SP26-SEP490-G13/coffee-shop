const bannerRepository = require("../repositories/BannerRepository");
const ErrorResponse = require("../utils/ErrorResponse");

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
      throw new ErrorResponse(400, "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ");
    }

    if (end < start) {
      throw new ErrorResponse(400, "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
    }
  }

  async create(data) {
    if (!data.title || data.title.trim() === "") {
      throw new ErrorResponse(400, "Tiêu đề không được để trống");
    }

    if (!data.image || data.image.trim() === "") {
      throw new ErrorResponse(400, "Hình ảnh banner không được để trống");
    }

    const existedTitle = await bannerRepository.findByTitle(data.title.trim());

    if (existedTitle) {
      throw new ErrorResponse(400, "Tiêu đề quảng cáo đã tồn tại");
    }

    this.validateDateRange(data.start_date, data.end_date);

    return bannerRepository.create(data);
  }

  async update(id, data) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new ErrorResponse(404, "Không tìm thấy banner");
    }

    if (!data.title || data.title.trim() === "") {
      throw new ErrorResponse(400, "Tiêu đề không được để trống");
    }

    if (!data.image || data.image.trim() === "") {
      throw new ErrorResponse(400, "Hình ảnh banner không được để trống");
    }

    const existedTitle = await bannerRepository.findByTitleExcludeId(
      data.title.trim(),
      id
    );

    if (existedTitle) {
      throw new ErrorResponse(400, "Tiêu đề quảng cáo đã tồn tại");
    }

    this.validateDateRange(data.start_date, data.end_date);

    return bannerRepository.update(id, data);
  }

  async delete(id) {
    const banner = await bannerRepository.findById(id);
    if (!banner) {
      throw new ErrorResponse(404, "Không tìm thấy banner để xóa");
    }
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
