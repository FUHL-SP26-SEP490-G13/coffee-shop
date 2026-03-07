const Joi = require("joi");

const createDiscountSchema = Joi.object({
  code: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Mã giảm giá không được để trống",
    "any.required": "Mã giảm giá là bắt buộc",
    "string.min": "Mã giảm giá tối thiểu 3 ký tự",
    "string.max": "Mã giảm giá tối đa 50 ký tự",
  }),

  description: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Mô tả không được để trống",
    "any.required": "Mô tả là bắt buộc",
    "string.min": "Mô tả tối thiểu 3 ký tự",
    "string.max": "Mô tả tối đa 255 ký tự",
  }),

  percentage: Joi.number().min(1).max(100).required().messages({
    "number.base": "Phần trăm phải là số",
    "number.min": "Phần trăm phải >= 1",
    "number.max": "Phần trăm phải <= 100",
    "any.required": "Phần trăm là bắt buộc",
  }),

  min_order_amount: Joi.number().min(0).required().messages({
    "number.base": "Đơn tối thiểu phải là số",
    "number.min": "Đơn tối thiểu phải >= 0",
    "any.required": "Đơn tối thiểu là bắt buộc",
  }),

  max_discount_amount: Joi.number().min(0).required().messages({
    "number.base": "Giảm tối đa phải là số",
    "number.min": "Giảm tối đa phải >= 0",
    "any.required": "Giảm tối đa là bắt buộc",
  }),

  usage_limit: Joi.number().integer().min(1).max(1000).required().messages({
    "number.base": "Giới hạn lượt phải là số",
    "number.integer": "Giới hạn lượt phải là số nguyên",
    "number.min": "Giới hạn lượt phải >= 1",
    "number.max": "Giới hạn lượt phải <= 1000",
    "any.required": "Giới hạn lượt là bắt buộc",
  }),

  valid_from: Joi.date().required().messages({
    "date.base": "Ngày bắt đầu không hợp lệ",
    "any.required": "Ngày bắt đầu là bắt buộc",
  }),

  valid_until: Joi.date().greater(Joi.ref("valid_from")).required().messages({
    "date.base": "Ngày kết thúc không hợp lệ",
    "date.greater": "Ngày kết thúc phải sau ngày bắt đầu",
    "any.required": "Ngày kết thúc là bắt buộc",
  }),

  is_active: Joi.boolean().required().messages({
    "boolean.base": "Trạng thái kích hoạt không hợp lệ",
    "any.required": "Trạng thái kích hoạt là bắt buộc",
  }),
});

const updateDiscountSchema = Joi.object({
  code: Joi.string().trim().min(3).max(50).messages({
    "string.empty": "Mã giảm giá không được để trống",
    "string.min": "Mã giảm giá tối thiểu 3 ký tự",
    "string.max": "Mã giảm giá tối đa 50 ký tự",
  }),

  description: Joi.string().trim().min(3).max(255).messages({
    "string.empty": "Mô tả không được để trống",
    "string.min": "Mô tả tối thiểu 3 ký tự",
    "string.max": "Mô tả tối đa 255 ký tự",
  }),

  percentage: Joi.number().min(1).max(100).messages({
    "number.base": "Phần trăm phải là số",
    "number.min": "Phần trăm phải >= 1",
    "number.max": "Phần trăm phải <= 100",
  }),

  min_order_amount: Joi.number().min(0).messages({
    "number.base": "Đơn tối thiểu phải là số",
    "number.min": "Đơn tối thiểu phải >= 0",
  }),

  max_discount_amount: Joi.number().min(0).messages({
    "number.base": "Giảm tối đa phải là số",
    "number.min": "Giảm tối đa phải >= 0",
  }),

  usage_limit: Joi.number().integer().min(1).max(1000).messages({
    "number.base": "Giới hạn lượt phải là số",
    "number.integer": "Giới hạn lượt phải là số nguyên",
    "number.min": "Giới hạn lượt phải >= 1",
    "number.max": "Giới hạn lượt phải <= 1000",
  }),

  valid_from: Joi.date().messages({
    "date.base": "Ngày bắt đầu không hợp lệ",
  }),

  valid_until: Joi.date().messages({
    "date.base": "Ngày kết thúc không hợp lệ",
  }),

  is_active: Joi.boolean().messages({
    "boolean.base": "Trạng thái kích hoạt không hợp lệ",
  }),
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.valid_from &&
      value.valid_until &&
      new Date(value.valid_until) <= new Date(value.valid_from)
    ) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "object.min": "Phải có ít nhất 1 trường để cập nhật",
    "any.invalid": "Ngày kết thúc phải sau ngày bắt đầu",
  });

module.exports = {
  createDiscountSchema,
  updateDiscountSchema,
};
