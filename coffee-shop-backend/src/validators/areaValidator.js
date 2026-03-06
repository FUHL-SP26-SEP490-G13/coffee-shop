const Joi = require('joi');

const createAreaSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Tên khu vực không được để trống',
    'string.min': 'Tên khu vực phải có ít nhất 2 ký tự',
    'string.max': 'Tên khu vực không được vượt quá 50 ký tự',
    'any.required': 'Tên khu vực là bắt buộc',
  }),
});


const updateAreaSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Tên khu vực phải có ít nhất 2 ký tự',
    'string.max': 'Tên khu vực không được vượt quá 50 ký tự',
  }),
}).min(1);


const areaIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID khu vực phải là số',
    'number.integer': 'ID khu vực phải là số nguyên',
    'number.positive': 'ID khu vực phải là số dương',
    'any.required': 'ID khu vực là bắt buộc',
  }),
});

module.exports = {
  createAreaSchema,
  updateAreaSchema,
  areaIdSchema,
};
