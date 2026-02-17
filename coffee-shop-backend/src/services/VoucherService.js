const VoucherRepository = require("../repositories/VoucherRepository");

class VoucherService {
  async getAll(params) {
    return VoucherRepository.findAll(params);
  }

  async getById(id) {
    const voucher = await VoucherRepository.findById(id);
    if (!voucher) {
      throw new Error("Voucher không tồn tại");
    }
    return voucher;
  }

  async create(data) {
    return VoucherRepository.create(data);
  }

  async update(id, data) {
    return VoucherRepository.update(id, data);
  }

  async delete(id) {
    return VoucherRepository.delete(id);
  }
}

module.exports = new VoucherService();
