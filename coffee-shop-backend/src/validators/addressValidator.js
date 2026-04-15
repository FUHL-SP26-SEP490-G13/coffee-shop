const Joi = require('joi');

const PHONE_REGEX = /^(?:\+84\d{9,10}|84\d{9,10}|\d{10,11})$/;

const optionalNullablePhoneSchema = Joi.string()
  .trim()
  .pattern(PHONE_REGEX)
  .optional()
  .allow(null, '')
  .messages({
    'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số hoặc bắt đầu bằng +84',
  });

/**
 * Validation schema for create address
 */
const createAddressSchema = Joi.object({
  receiver_name: Joi.string().trim().max(100).optional().allow(null, '').messages({
    'string.max': 'Tên người nhận không được vượt quá 100 ký tự',
  }),
  receiver_phone: optionalNullablePhoneSchema,
  address: Joi.string().trim().min(5).max(255).required().messages({
    'string.empty': 'Địa chỉ không được để trống',
    'string.min': 'Địa chỉ phải có ít nhất 5 ký tự',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
    'any.required': 'Địa chỉ là bắt buộc',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').default('home').messages({
    'any.only': 'Loại địa chỉ không hợp lệ',
  }),
  is_default: Joi.number().integer().valid(0, 1).optional(),
});

/**
 * Validation schema for update address
 */
const updateAddressSchema = Joi.object({
  receiver_name: Joi.string().trim().max(100).optional().allow(null, '').messages({
    'string.max': 'Tên người nhận không được vượt quá 100 ký tự',
  }),
  receiver_phone: optionalNullablePhoneSchema,
  address: Joi.string().trim().min(5).max(255).optional().messages({
    'string.min': 'Địa chỉ phải có ít nhất 5 ký tự',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').optional().messages({
    'any.only': 'Loại địa chỉ không hợp lệ',
  }),
  is_default: Joi.number().integer().valid(0, 1).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất 1 trường để cập nhật địa chỉ',
  });

/**
 * Validation schema for address id param
 */
const addressIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID địa chỉ phải là số',
    'number.integer': 'ID địa chỉ phải là số nguyên',
    'number.positive': 'ID địa chỉ phải lớn hơn 0',
    'any.required': 'ID địa chỉ là bắt buộc',
  }),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
};
