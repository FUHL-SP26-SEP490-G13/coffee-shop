const Joi = require('joi');

const createTableSchema = Joi.object({
  table_number: Joi.string().min(1).max(10).required().messages({
    'string.empty': 'Số bàn không được để trống',
    'string.min': 'Số bàn phải có ít nhất 1 ký tự',
    'string.max': 'Số bàn không được vượt quá 10 ký tự',
    'any.required': 'Số bàn là bắt buộc',
  }),
  area_id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID khu vực phải là số',
    'number.integer': 'ID khu vực phải là số nguyên',
    'number.positive': 'ID khu vực phải là số dương',
    'any.required': 'ID khu vực là bắt buộc',
  }),
  status: Joi.string().valid('available', 'occupied', 'reserved').default('available').messages({
    'any.only': 'Trạng thái không hợp lệ',
  }),
});

const updateTableSchema = Joi.object({
  table_number: Joi.string().min(1).max(10).optional().messages({
    'string.min': 'Số bàn phải có ít nhất 1 ký tự',
    'string.max': 'Số bàn không được vượt quá 10 ký tự',
  }),
  area_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'ID khu vực phải là số',
    'number.integer': 'ID khu vực phải là số nguyên',
    'number.positive': 'ID khu vực phải là số dương',
  }),
  status: Joi.string().valid('available', 'occupied', 'reserved').optional().messages({
    'any.only': 'Trạng thái không hợp lệ',
  }),
}).min(1);

const tableIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID bàn phải là số',
    'number.integer': 'ID bàn phải là số nguyên',
    'number.positive': 'ID bàn phải là số dương',
    'any.required': 'ID bàn là bắt buộc',
  }),
});

module.exports = {
  createTableSchema,
  updateTableSchema,
  tableIdSchema,
};
