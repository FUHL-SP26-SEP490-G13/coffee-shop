const DiscountRepository = require("../repositories/DiscountRepository");

class DiscountService {
  async getAll(params) {
    return DiscountRepository.findAll(params);
  }

  async getById(id) {
    const discount = await DiscountRepository.findById(id);
    if (!discount) throw new Error("Discount không tồn tại");
    return discount;
  }

  async create(data) {
    // validate nhẹ, đủ dùng
    if (!data.code) throw new Error("code là bắt buộc");
    if (data.percentage === undefined || data.percentage === null)
      throw new Error("percentage là bắt buộc");

    const percentage = Number(data.percentage);
    if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
      throw new Error("percentage phải nằm trong (0 - 100]");
    }

    return DiscountRepository.create({
      ...data,
      percentage,
      min_order_amount:
        data.min_order_amount === "" || data.min_order_amount == null
          ? 0
          : Number(data.min_order_amount),
      max_discount_amount:
        data.max_discount_amount === "" || data.max_discount_amount == null
          ? null
          : Number(data.max_discount_amount),
      usage_limit:
        data.usage_limit === "" || data.usage_limit == null
          ? null
          : Number(data.usage_limit),
      is_active: data.is_active ? 1 : 0,
    });
  }

  async update(id, data) {
    const percentage = Number(data.percentage);
    if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
      throw new Error("percentage phải nằm trong (0 - 100]");
    }

    return DiscountRepository.update(id, {
      ...data,
      percentage,
      min_order_amount:
        data.min_order_amount === "" || data.min_order_amount == null
          ? 0
          : Number(data.min_order_amount),
      max_discount_amount:
        data.max_discount_amount === "" || data.max_discount_amount == null
          ? null
          : Number(data.max_discount_amount),
      usage_limit:
        data.usage_limit === "" || data.usage_limit == null
          ? null
          : Number(data.usage_limit),
      is_active: data.is_active ? 1 : 0,
    });
  }

  async delete(id) {
    return DiscountRepository.delete(id);
  }
}

module.exports = new DiscountService();
