const Joi = require('joi');

/**
 * Validation schema for creating category
 */
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Tên category không được để trống',
    'string.min': 'Tên category phải có ít nhất 2 ký tự',
    'string.max': 'Tên category không được vượt quá 100 ký tự',
    'any.required': 'Tên category là bắt buộc',
  }),
});

/**
 * Validation schema for updating category
 */
const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Tên category không được để trống',
    'string.min': 'Tên category phải có ít nhất 2 ký tự',
    'string.max': 'Tên category không được vượt quá 100 ký tự',
    'any.required': 'Tên category là bắt buộc',
  }),
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
  keyword: Joi.string().allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  offset: Joi.number().integer().min(0).optional().default(0),
  page: Joi.number().integer().min(1).optional().default(1),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  searchCategorySchema,
};
