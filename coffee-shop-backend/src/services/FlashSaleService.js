const FlashSaleRepository = require("../repositories/FlashSaleRepository");

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
    return await FlashSaleRepository.create(data);
  }

  async update(id, data) {
    return await FlashSaleRepository.update(id, data);
  }

  async delete(id) {
    return await FlashSaleRepository.delete(id);
  }
}

module.exports = new FlashSaleService();
