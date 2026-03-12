const Joi = require('joi');

const createTableSchema = Joi.object({
  seatNumber: Joi.number().integer().min(1).required().messages({
    'number.base': 'Số chỗ ngồi phải là số',
    'number.integer': 'Số chỗ ngồi phải là số nguyên',
    'number.min': 'Số chỗ ngồi phải lớn hơn 0',
    'any.required': 'Số chỗ ngồi là bắt buộc',
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
  seatNumber: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Số chỗ ngồi phải là số',
    'number.integer': 'Số chỗ ngồi phải là số nguyên',
    'number.min': 'Số chỗ ngồi phải lớn hơn 0',
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
