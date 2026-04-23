const Joi = require('joi');

/**
 * Validation schema for creating category
 */
const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Tên category không được để trống',
    'string.min': 'Tên category phải có ít nhất 2 ký tự',
    'string.max': 'Tên category không được vượt quá 100 ký tự',
    'any.required': 'Tên category là bắt buộc',
  }),
  code: Joi.string()
    .trim()
    .pattern(/^[A-Z]{1,5}-[0-9]{1,5}$/)
    .required()
    .messages({
      'string.empty': 'Code danh mục không được để trống',
      'string.pattern.base':
        'Code phải có định dạng: CHỮ HOA - SỐ (VD: CF-001)',
      'any.required': 'Code danh mục là bắt buộc',
    }),

});

/**
 * Validation schema for updating category
 */
const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.empty': 'Tên category không được để trống',
    'string.min': 'Tên category phải có ít nhất 2 ký tự',
    'string.max': 'Tên category không được vượt quá 100 ký tự',
  }),
  code: Joi.string()
    .trim()
    .pattern(/^[A-Z]{1,5}-[0-9]{1,5}$/)
    .optional()
    .messages({
      'string.empty': 'Code danh mục không được để trống',
      'string.pattern.base':
        'Code phải có định dạng: CHỮ HOA - SỐ (VD: CF-001)',
      'any.required': 'Code danh mục là bắt buộc',
    }),
  remove_image: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false'))
    .optional(),

});

/**
 * Validation schema for category ID param
 */
const categoryIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID category phải là số',
    'number.integer': 'ID category phải là số nguyên',
    'number.positive': 'ID category phải là số dương',
    'any.required': 'ID category là bắt buộc',
  }),
});

/**
 * Validation schema for search query
 */
const searchCategorySchema = Joi.object({
  keyword: Joi.string().allow('').optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi',
  }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit phải là số',
      'number.min': 'Limit tối thiểu là 1',
      'number.max': 'Limit tối đa là 100',
    }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Offset phải là số',
    'number.min': 'Offset không được âm',
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page phải là số',
    'number.min': 'Page tối thiểu là 1',
  }),
  with_count: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'with_count chỉ chấp nhận "true" hoặc "false"',
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  searchCategorySchema,
};
