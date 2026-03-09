const Joi = require('joi');

/**
 * Validation schema for creating recipe
 */
const createRecipeSchema = Joi.object({
  product_size_id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kích thước sản phẩm phải là số',
    'number.integer': 'ID kích thước sản phẩm phải là số nguyên',
    'number.positive': 'ID kích thước sản phẩm phải là số dương',
    'any.required': 'ID kích thước sản phẩm là bắt buộc',
  }),
  ingredient_id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID nguyên liệu phải là số',
    'number.integer': 'ID nguyên liệu phải là số nguyên',
    'number.positive': 'ID nguyên liệu phải là số dương',
    'any.required': 'ID nguyên liệu là bắt buộc',
  }),
  quantity: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Số lượng phải là số',
    'number.min': 'Số lượng không được âm',
    'any.required': 'Số lượng là bắt buộc',
  }),
});

/**
 * Validation schema for updating recipe
 */
const updateRecipeSchema = Joi.object({
  ingredient_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'ID nguyên liệu phải là số',
    'number.integer': 'ID nguyên liệu phải là số nguyên',
    'number.positive': 'ID nguyên liệu phải là số dương',
  }),
  quantity: Joi.number().precision(2).min(0).optional().messages({
    'number.base': 'Số lượng phải là số',
    'number.min': 'Số lượng không được âm',
  }),
});

/**
 * Validation schema for recipe ID param
 */
const recipeIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID công thức phải là số',
    'number.integer': 'ID công thức phải là số nguyên',
    'number.positive': 'ID công thức phải là số dương',
    'any.required': 'ID công thức là bắt buộc',
  }),
});

/**
 * Validation schema for product size ID param
 */
const productSizeIdSchema = Joi.object({
  productSizeId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID kích thước sản phẩm phải là số',
    'number.integer': 'ID kích thước sản phẩm phải là số nguyên',
    'number.positive': 'ID kích thước sản phẩm phải là số dương',
    'any.required': 'ID kích thước sản phẩm là bắt buộc',
  }),
});

/**
 * Validation schema for product ID param
 */
const productIdSchema = Joi.object({
  productId: Joi.number().integer().positive().required().messages({
    'number.base': 'ID sản phẩm phải là số',
    'number.integer': 'ID sản phẩm phải là số nguyên',
    'number.positive': 'ID sản phẩm phải là số dương',
    'any.required': 'ID sản phẩm là bắt buộc',
  }),
});

/**
 * Validation schema for creating ingredient
 */
const createIngredientSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Tên nguyên liệu không được để trống',
    'string.min': 'Tên nguyên liệu phải có ít nhất 2 ký tự',
    'string.max': 'Tên nguyên liệu không được vượt quá 100 ký tự',
    'any.required': 'Tên nguyên liệu là bắt buộc',
  }),
  unit_type: Joi.string().max(10).required().messages({
    'string.empty': 'Loại đơn vị không được để trống',
    'string.max': 'Loại đơn vị không được vượt quá 10 ký tự',
    'any.required': 'Loại đơn vị là bắt buộc',
  }),
  unit: Joi.string().max(20).required().messages({
    'string.empty': 'Đơn vị không được để trống',
    'string.max': 'Đơn vị không được vượt quá 20 ký tự',
    'any.required': 'Đơn vị là bắt buộc',
  }),
});

/**
 * Validation schema for updating ingredient
 */
const updateIngredientSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.empty': 'Tên nguyên liệu không được để trống',
    'string.min': 'Tên nguyên liệu phải có ít nhất 2 ký tự',
    'string.max': 'Tên nguyên liệu không được vượt quá 100 ký tự',
  }),
  unit_type: Joi.string().max(10).optional().messages({
    'string.empty': 'Loại đơn vị không được để trống',
    'string.max': 'Loại đơn vị không được vượt quá 10 ký tự',
  }),
  unit: Joi.string().max(20).optional().messages({
    'string.empty': 'Đơn vị không được để trống',
    'string.max': 'Đơn vị không được vượt quá 20 ký tự',
  }),
});

/**
 * Validation schema for ingredient ID param
 */
const ingredientIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID nguyên liệu phải là số',
    'number.integer': 'ID nguyên liệu phải là số nguyên',
    'number.positive': 'ID nguyên liệu phải là số dương',
    'any.required': 'ID nguyên liệu là bắt buộc',
  }),
});

/**
 * Validation schema for search query
 */
const searchIngredientSchema = Joi.object({
  keyword: Joi.string().allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
});

module.exports = {
  createRecipeSchema,
  updateRecipeSchema,
  recipeIdSchema,
  productSizeIdSchema,
  productIdSchema,
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  searchIngredientSchema,
};
