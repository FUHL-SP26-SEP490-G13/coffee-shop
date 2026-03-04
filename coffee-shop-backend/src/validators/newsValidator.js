const Joi = require("joi");

const createNewsSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "any.required": "Tiêu đề là bắt buộc",
    "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
  }),

  summary: Joi.string().trim().min(10).max(500).required().messages({
    "string.empty": "Tóm tắt không được để trống",
    "any.required": "Tóm tắt là bắt buộc",
    "string.min": "Tóm tắt phải có ít nhất 10 ký tự",
    "string.max": "Tóm tắt không được vượt quá 500 ký tự",
  }),

  content: Joi.string().trim().min(20).required().messages({
    "string.empty": "Nội dung không được để trống",
    "any.required": "Nội dung là bắt buộc",
    "string.min": "Nội dung phải có ít nhất 20 ký tự",
  }),

  tag: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tag không được để trống",
    "any.required": "Tag là bắt buộc",
    "string.min": "Tag phải có ít nhất 2 ký tự",
    "string.max": "Tag không được vượt quá 100 ký tự",
  }),
});

module.exports = {
  createNewsSchema,
};