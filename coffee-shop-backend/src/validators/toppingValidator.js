const Joi = require('joi');

/**
 * Validation schema for creating topping
 */
const createToppingSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Tên topping không được để trống',
    'string.min': 'Tên topping phải có ít nhất 2 ký tự',
    'string.max': 'Tên topping không được vượt quá 50 ký tự',
    'any.required': 'Tên topping là bắt buộc',
  }),
  price: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Giá topping phải là số',
    'number.min': 'Giá topping không được âm',
    'any.required': 'Giá topping là bắt buộc',
  }),
});

/**
 * Validation schema for updating topping
 */
const updateToppingSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.empty': 'Tên topping không được để trống',
    'string.min': 'Tên topping phải có ít nhất 2 ký tự',
    'string.max': 'Tên topping không được vượt quá 50 ký tự',
  }),
  price: Joi.number().precision(2).min(0).optional().messages({
    'number.base': 'Giá topping phải là số',
    'number.min': 'Giá topping không được âm',
  }),
});

/**
 * Validation schema for topping ID param
 */
const toppingIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID topping phải là số',
    'number.integer': 'ID topping phải là số nguyên',
    'number.positive': 'ID topping phải là số dương',
    'any.required': 'ID topping là bắt buộc',
  }),
});

/**
 * Validation schema for search query
 */
const searchToppingSchema = Joi.object({
  keyword: Joi.string().allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  offset: Joi.number().integer().min(0).optional().default(0),
  page: Joi.number().integer().min(1).optional().default(1),
});

module.exports = {
  createToppingSchema,
  updateToppingSchema,
  toppingIdSchema,
  searchToppingSchema,
};
