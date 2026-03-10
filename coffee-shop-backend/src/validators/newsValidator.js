const Joi = require("joi");

const createNewsSchema = Joi.object({
  title: Joi.string().trim().min(10).max(100).required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "any.required": "Tiêu đề là bắt buộc",
    "string.min": "Tiêu đề phải có ít nhất 10 ký tự",
    "string.max": "Tiêu đề không được vượt quá 100 ký tự",
  }),

  summary: Joi.string().trim().min(10).max(2000).required().messages({
    "string.empty": "Tóm tắt không được để trống",
    "any.required": "Tóm tắt là bắt buộc",
    "string.min": "Tóm tắt phải có ít nhất 10 ký tự",
    "string.max": "Tóm tắt không được vượt quá 2000 ký tự",
  }),

  content: Joi.string().trim().min(120).max(5000).required().messages({
    "string.empty": "Nội dung không được để trống",
    "any.required": "Nội dung là bắt buộc",
    "string.min": "Nội dung phải có ít nhất 120 ký tự",
  }),

  tag: Joi.string()
    .trim()
    .pattern(/^#[a-zA-Z0-9_]{2,}$/)
    .required()
    .messages({
      "string.empty": "Tag không được để trống",
      "any.required": "Tag là bắt buộc",
      "string.pattern.base":
        "Tag phải đúng định dạng #xx trở lên, ví dụ: #coffee hoặc #tin1",
    }),
});

module.exports = {
  createNewsSchema,
};