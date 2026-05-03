const FlashSaleRepository = require("../repositories/FlashSaleRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class FlashSaleService {
  async getCurrentActive() {
    return await FlashSaleRepository.findCurrentActive();
  }

  async getAll() {
    return await FlashSaleRepository.findAll();
  }

  async getById(id) {
    const flashSale = await FlashSaleRepository.findById(id);
    if (!flashSale) {
      throw new ErrorResponse(404, "Không tìm thấy chương trình Flash Sale");
    }
    return flashSale;
  }

  async create(data) {
    if (!data.title || data.title.trim() === '') {
      throw new ErrorResponse(400, "Tiêu đề không được để trống");
    }

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ErrorResponse(400, "Thời gian bắt đầu hoặc kết thúc không hợp lệ");
    }

    if (end <= start) {
      throw new ErrorResponse(400, "Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    // Check overlap for active campaigns
    if (!data.status || data.status === 'active') {
      const overlap = await FlashSaleRepository.checkOverlap(data.start_time, data.end_time);
      if (overlap) {
        throw new ErrorResponse(400, `Không thể tạo. Bị trùng khung giờ với chiến dịch đang chạy: "${overlap.title}"`);
      }
    }
    return await FlashSaleRepository.create(data);
  }

  async update(id, data) {
    const existing = await FlashSaleRepository.findById(id);
    if (!existing) {
      throw new ErrorResponse(404, "Không tìm thấy chương trình Flash Sale");
    }

    if (data.title !== undefined && data.title.trim() === '') {
      throw new ErrorResponse(400, "Tiêu đề không được để trống");
    }

    if (data.start_time && data.end_time) {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new ErrorResponse(400, "Thời gian bắt đầu hoặc kết thúc không hợp lệ");
      }
      if (end <= start) {
        throw new ErrorResponse(400, "Thời gian kết thúc phải sau thời gian bắt đầu");
      }
    }

    if (!data.status || data.status === 'active') {
      const overlap = await FlashSaleRepository.checkOverlap(data.start_time || existing.start_time, data.end_time || existing.end_time, id);
      if (overlap) {
        throw new ErrorResponse(400, `Không thể cập nhật. Bị trùng khung giờ với chiến dịch đang chạy: "${overlap.title}"`);
      }
    }
    return await FlashSaleRepository.update(id, data);
  }

  async delete(id) {
    const existing = await FlashSaleRepository.findById(id);
    if (!existing) {
      throw new ErrorResponse(404, "Không tìm thấy chương trình Flash Sale để xóa");
    }
    return await FlashSaleRepository.delete(id);
  }
}

module.exports = new FlashSaleService();
