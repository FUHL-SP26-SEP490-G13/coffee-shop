const Joi = require('joi');

/**
 * Validation schema for creating product
 * name, category_id, status, description, images
 */
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Tên product không được để trống',
    'string.min': 'Tên product phải có ít nhất 2 ký tự',
    'string.max': 'Tên product không được vượt quá 100 ký tự',
    'any.required': 'Tên product là bắt buộc',
  }),
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID phải là số',
    'number.integer': 'Category ID phải là số nguyên',
    'number.positive': 'Category ID phải là số dương',
    'any.required': 'Category ID là bắt buộc',
  }),
  status: Joi.string().valid('available', 'unavailable').optional().messages({
    'any.only': 'Status chỉ chấp nhận "available" hoặc "unavailable"',
  }),
  // description: Joi.string().max(255).allow(null, '').optional().messages({
  //   'string.max': 'Mô tả không được vượt quá 255 ký tự',
  // }),
});

/**
 * Validation schema for updating product
 */
const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.empty': 'Tên product không được để trống',
    'string.min': 'Tên product phải có ít nhất 2 ký tự',
    'string.max': 'Tên product không được vượt quá 100 ký tự',
  }),
  category_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Category ID phải là số',
    'number.integer': 'Category ID phải là số nguyên',
    'number.positive': 'Category ID phải là số dương',
  }),
  status: Joi.string().valid('available', 'unavailable').optional().messages({
    'any.only': 'Status chỉ chấp nhận "available" hoặc "unavailable"',
  }),
  description: Joi.string().max(255).allow(null, '').optional().messages({
    'string.max': 'Mô tả không được vượt quá 255 ký tự',
  }),
  sizes: Joi.array()
    .items(
      Joi.object({
        size: Joi.string().valid('S', 'M', 'L' , 's', 'm', 'l').required().messages({
          'any.only': 'Size chỉ chấp nhận S, M, hoặc L',
          'any.required': 'Size là bắt buộc',
        }),
        price: Joi.number().positive().required().messages({
          'number.base': 'Giá phải là số',
          'number.positive': 'Giá phải là số dương',
          'any.required': 'Giá là bắt buộc',
        }),
      })
    )
    .max(3)
    .optional()
    .messages({
      'array.base': 'Sizes phải là mảng',
      'array.max': 'Tối đa chỉ có 3 loại size (S, M, L)',
    }),
  deleteSizeIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional()
    .messages({
      'array.base': 'deleteSizeIds phải là mảng',
    }),
  deleteImageIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional()
    .messages({
      'array.base': 'deleteImageIds phải là mảng',
    }),
});

/**
 * Validation schema for product ID param
 */
const productIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID product phải là số',
    'number.integer': 'ID product phải là số nguyên',
    'number.positive': 'ID product phải là số dương',
    'any.required': 'ID product là bắt buộc',
  }),
});

/**
 * Validation schema for search query
 */
const searchProductSchema = Joi.object({
  keyword: Joi.string().allow('').optional().messages({
    'string.base': 'Từ khóa tìm kiếm phải là chuỗi',
  }),
  category_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'Category ID phải là số',
    'number.integer': 'Category ID phải là số nguyên',
    'number.positive': 'Category ID phải là số dương',
  }),
  status: Joi.string().valid('available', 'unavailable').optional().messages({
    'any.only': 'Status chỉ chấp nhận "available" hoặc "unavailable"',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
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
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  searchProductSchema,
};