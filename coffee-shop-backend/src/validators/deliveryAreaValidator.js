const Joi = require('joi');

const provinceSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Tên tỉnh/thành không được để trống',
    'string.max': 'Tên tỉnh/thành tối đa 100 ký tự',
    'any.required': 'Tên tỉnh/thành là bắt buộc',
  }),
});

const createWardSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Tên xã/phường không được để trống',
    'string.max': 'Tên xã/phường tối đa 100 ký tự',
    'any.required': 'Tên xã/phường là bắt buộc',
  }),
  province_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Tỉnh/thành không hợp lệ',
    'number.integer': 'Tỉnh/thành không hợp lệ',
    'number.positive': 'Tỉnh/thành không hợp lệ',
    'any.required': 'Tỉnh/thành là bắt buộc',
  }),
  is_active: Joi.number().integer().valid(0, 1).optional(),
});

const updateWardSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().messages({
    'string.max': 'Tên xã/phường tối đa 100 ký tự',
  }),
  province_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Tỉnh/thành không hợp lệ',
    'number.integer': 'Tỉnh/thành không hợp lệ',
    'number.positive': 'Tỉnh/thành không hợp lệ',
  }),
  is_active: Joi.number().integer().valid(0, 1).optional(),
})
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất 1 trường để cập nhật xã/phường',
  });

const wardIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const wardQuerySchema = Joi.object({
  province_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Tỉnh/thành không hợp lệ',
    'number.integer': 'Tỉnh/thành không hợp lệ',
    'number.positive': 'Tỉnh/thành không hợp lệ',
    'any.required': 'province_id là bắt buộc',
  }),
  active_only: Joi.string().valid('true', 'false').optional(),
});

module.exports = {
  provinceSchema,
  createWardSchema,
  updateWardSchema,
  wardIdParamSchema,
  wardQuerySchema,
};
