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
    data.code = data.code?.trim()?.toUpperCase();

    const existing = await DiscountRepository.findByCode(data.code);
    if (existing) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    return DiscountRepository.create({
      ...data,
      is_active: data.is_active ? 1 : 0,
    });
  }

  async update(id, data) {
    const current = await DiscountRepository.findById(id);
    if (!current) throw new Error("Discount không tồn tại");

    const normalizedCode = data.code?.trim()?.toUpperCase();

    if (Number(current.used_count) > 0) {
      return DiscountRepository.update(id, {
        description: data.description?.trim(),
        valid_until: data.valid_until,
        is_active: data.is_active ? 1 : 0,
      });
    }

    const existing = await DiscountRepository.findByCode(normalizedCode);
    if (existing && existing.id != id) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    return DiscountRepository.update(id, {
      code: normalizedCode,
      description: data.description?.trim(),
      percentage: data.percentage,
      min_order_amount: data.min_order_amount,
      max_discount_amount: data.max_discount_amount,
      usage_limit: data.usage_limit,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      is_active: data.is_active ? 1 : 0,
    });
  }

  async delete(id) {
    const discount = await DiscountRepository.findById(id);

    if (!discount) {
      throw new Error("Không tồn tại");
    }

    // chưa có ai dùng → xóa cứng
    if (Number(discount.used_count) === 0) {
      await DiscountRepository.deleteHard(id);
      return true;
    }

    // đã có người dùng → xóa mềm
    const timestamp = this.getDeleteTimestamp();
    const newCode = `${discount.code}__DELETED__${timestamp}`;

    await DiscountRepository.softDelete(id, newCode);

    return true;
  }

  getDeleteTimestamp() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }
}

module.exports = new DiscountService();
