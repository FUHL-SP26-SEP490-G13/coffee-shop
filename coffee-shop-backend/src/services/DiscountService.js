const DiscountRepository = require("../repositories/DiscountRepository");
const Joi = require("joi");

const createSchema = Joi.object({
  code: Joi.string().trim().min(3).max(50).required(),
  description: Joi.string().trim().min(3).required(),
  percentage: Joi.number().min(1).max(100).required(),
  min_order_amount: Joi.number().min(0).required(),
  max_discount_amount: Joi.number().min(0).required(),
  usage_limit: Joi.number().integer().min(1).required(),
  valid_from: Joi.date().required(),
  valid_until: Joi.date().greater(Joi.ref("valid_from")).required(),
  is_active: Joi.boolean().required(),
});

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
    // 1️⃣ Validate bằng Joi
    const { error, value } = createSchema.validate(data, {
      abortEarly: false,
    });

    if (error) {
      throw new Error(error.details.map((e) => e.message).join(", "));
    }

    // 2️⃣ Chuẩn hóa code
    value.code = value.code.toUpperCase();

    // 3️⃣ Check trùng code
    const existing = await DiscountRepository.findByCode(value.code);
    if (existing) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    // 4️⃣ Lưu
    return DiscountRepository.create({
      ...value,
      is_active: value.is_active ? 1 : 0,
    });
  }

  async update(id, data) {
    const { error, value } = createSchema.validate(data, {
      abortEarly: false,
    });

    if (error) {
      throw new Error(error.details.map((e) => e.message).join(", "));
    }

    value.code = value.code.toUpperCase();

    // Check trùng nhưng không tính chính nó
    const existing = await DiscountRepository.findByCode(value.code);
    if (existing && existing.id != id) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    return DiscountRepository.update(id, {
      ...value,
      is_active: value.is_active ? 1 : 0,
    });
  }

  async delete(id) {
    const discount = await DiscountRepository.findById(id);
    if (!discount) throw new Error("Không tồn tại");

    if (Number(discount.used_count) > 0) {
      throw new Error("Mã giảm giá đã được sử dụng nên không thể xóa");
    }

    return DiscountRepository.delete(id);
  }
}

module.exports = new DiscountService();
