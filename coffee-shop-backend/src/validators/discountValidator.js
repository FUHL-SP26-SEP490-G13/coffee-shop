const Joi = require("joi");

const baseDiscountSchema = {
  code: Joi.string().trim().min(1).max(50).messages({
    "string.base": "Mã giảm giá phải là chuỗi",
    "string.empty": "Mã giảm giá không được để trống",
    "string.max": "Mã giảm giá tối đa 50 ký tự",
  }),

  description: Joi.string().trim().min(1).max(255).allow(null, "").messages({
    "string.base": "Mô tả phải là chuỗi",
    "string.empty": "Mô tả không được để trống",
    "string.max": "Mô tả tối đa 255 ký tự",
  }),

  percentage: Joi.number().min(0).max(100).messages({
    "number.base": "Phần trăm phải là số",
    "number.min": "Phần trăm phải >= 0",
    "number.max": "Phần trăm phải <= 100",
  }),

  min_order_amount: Joi.number().min(0).messages({
    "number.base": "Đơn tối thiểu phải là số",
    "number.min": "Đơn tối thiểu phải >= 0",
  }),

  max_discount_amount: Joi.number().min(0).allow(null).messages({
    "number.base": "Giảm tối đa phải là số",
    "number.min": "Giảm tối đa phải >= 0",
  }),

  usage_limit: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "Giới hạn lượt phải là số",
    "number.integer": "Giới hạn lượt phải là số nguyên",
    "number.min": "Giới hạn lượt phải >= 0",
  }),

  valid_from: Joi.date().messages({
    "date.base": "Ngày bắt đầu không hợp lệ",
  }),

  valid_until: Joi.date().allow(null).messages({
    "date.base": "Ngày kết thúc không hợp lệ",
  }),
};

const createDiscountSchema = Joi.object({
  code: baseDiscountSchema.code.required().messages({
    "any.required": "Mã giảm giá là bắt buộc",
  }),

  description: baseDiscountSchema.description.required().messages({
    "any.required": "Mô tả là bắt buộc",
  }),

  percentage: baseDiscountSchema.percentage.required().messages({
    "any.required": "Phần trăm là bắt buộc",
  }),

  min_order_amount: baseDiscountSchema.min_order_amount.required().messages({
    "any.required": "Đơn tối thiểu là bắt buộc",
  }),

  max_discount_amount: baseDiscountSchema.max_discount_amount
    .required()
    .messages({
      "any.required": "Giảm tối đa là bắt buộc",
    }),

  usage_limit: baseDiscountSchema.usage_limit.required().messages({
    "any.required": "Giới hạn lượt là bắt buộc",
  }),

  valid_from: baseDiscountSchema.valid_from.required().messages({
    "any.required": "Ngày bắt đầu là bắt buộc",
  }),

  valid_until: baseDiscountSchema.valid_until.required().messages({
    "any.required": "Ngày kết thúc là bắt buộc",
  }),
})
  .custom((value, helpers) => {
    if (
      value.valid_from &&
      value.valid_until &&
      new Date(value.valid_from) >= new Date(value.valid_until)
    ) {
      return helpers.error("any.invalidDateRange");
    }

    return value;
  })
  .messages({
    "any.invalidDateRange": "Ngày kết thúc phải sau ngày bắt đầu",
  });

const updateDiscountSchema = Joi.object({
  code: baseDiscountSchema.code,
  description: baseDiscountSchema.description,
  percentage: baseDiscountSchema.percentage,
  min_order_amount: baseDiscountSchema.min_order_amount,
  max_discount_amount: baseDiscountSchema.max_discount_amount,
  usage_limit: baseDiscountSchema.usage_limit,
  valid_from: baseDiscountSchema.valid_from,
  valid_until: baseDiscountSchema.valid_until,
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.valid_from &&
      value.valid_until &&
      new Date(value.valid_from) >= new Date(value.valid_until)
    ) {
      return helpers.error("any.invalidDateRange");
    }

    return value;
  })
  .messages({
    "object.min": "Phải có ít nhất 1 trường để cập nhật",
    "any.invalidDateRange": "Ngày kết thúc phải sau ngày bắt đầu",
  });

module.exports = {
  createDiscountSchema,
  updateDiscountSchema,
};
