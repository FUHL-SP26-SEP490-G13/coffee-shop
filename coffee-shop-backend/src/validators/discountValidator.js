const Joi = require("joi");

const createDiscountSchema = Joi.object({
  code: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Mã giảm giá không được để trống",
    "any.required": "Mã giảm giá là bắt buộc",
  }),

  description: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Mô tả không được để trống",
    "any.required": "Mô tả là bắt buộc",
  }),

  percentage: Joi.number().min(1).max(100).required().messages({
    "number.base": "Phần trăm phải là số",
    "number.min": "Phần trăm phải >= 1",
    "number.max": "Phần trăm phải <= 100",
    "any.required": "Phần trăm là bắt buộc",
  }),

  min_order_amount: Joi.number().min(0).required().messages({
    "number.base": "Đơn tối thiểu phải là số",
    "any.required": "Đơn tối thiểu là bắt buộc",
  }),

  max_discount_amount: Joi.number().min(0).required().messages({
    "number.base": "Giảm tối đa phải là số",
    "any.required": "Giảm tối đa là bắt buộc",
  }),

  usage_limit: Joi.number().integer().min(1).max(1000).required().messages({
    "number.base": "Giới hạn lượt phải là số",
    "number.min": "Giới hạn lượt phải >= 1",
    "number.max": "Giới hạn lượt phải <= 1000",
    "any.required": "Giới hạn lượt là bắt buộc",
  }),

  valid_from: Joi.date().required().messages({
    "any.required": "Ngày bắt đầu là bắt buộc",
  }),

  valid_until: Joi.date().greater(Joi.ref("valid_from")).required().messages({
    "date.greater": "Ngày kết thúc phải sau ngày bắt đầu",
    "any.required": "Ngày kết thúc là bắt buộc",
  }),

  is_active: Joi.boolean().required(),
});

module.exports = {
  createDiscountSchema,
};
