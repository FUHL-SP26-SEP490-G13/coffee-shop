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
    return await FlashSaleRepository.findById(id);
  }

  async create(data) {
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
    if (!data.status || data.status === 'active') {
      const overlap = await FlashSaleRepository.checkOverlap(data.start_time, data.end_time, id);
      if (overlap) {
        throw new ErrorResponse(400, `Không thể cập nhật. Bị trùng khung giờ với chiến dịch đang chạy: "${overlap.title}"`);
      }
    }
    return await FlashSaleRepository.update(id, data);
  }

  async delete(id) {
    return await FlashSaleRepository.delete(id);
  }
}

module.exports = new FlashSaleService();
