const Joi = require("joi");

const createBannerSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "any.required": "Tiêu đề là bắt buộc",
    "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
  }),

  subtitle: Joi.string().allow("").min(10).max(500).messages({
    "string.min": "Mô tả phải có ít nhất 10 ký tự",
    "string.max": "Mô tả không được vượt quá 500 ký tự",
  }),

  button_text: Joi.string().allow("").min(3).max(100).messages({
    "string.min": "Text nút phải có ít nhất 3 ký tự",
    "string.max": "Text nút không được vượt quá 100 ký tự",
  }),

  button_link: Joi.string().allow("").min(3).max(255).messages({
    "string.min": "Link nút phải có ít nhất 3 ký tự",
    "string.max": "Link nút không được vượt quá 255 ký tự",
  }),

  is_active: Joi.boolean().required().messages({
    "any.required": "Trạng thái là bắt buộc",
  }),

  type: Joi.string().valid("banner").required(),
});

const updateBannerSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
    "string.max": "Tiêu đề không được vượt quá 255 ký tự",
    "any.required": "Tiêu đề là bắt buộc",
  }),

  subtitle: Joi.string().allow("").min(10).max(500).messages({
    "string.min": "Mô tả phải có ít nhất 10 ký tự",
    "string.max": "Mô tả không được vượt quá 500 ký tự",
  }),

  button_text: Joi.string().allow("").min(3).max(100).messages({
    "string.min": "Text nút phải có ít nhất 3 ký tự",
    "string.max": "Text nút không được vượt quá 100 ký tự",
  }),

  button_link: Joi.string().allow("").min(3).max(255).messages({
    "string.min": "Link nút phải có ít nhất 3 ký tự",
    "string.max": "Link nút không được vượt quá 255 ký tự",
  }),

  is_active: Joi.boolean()
    .truthy("true", "1", 1)
    .falsy("false", "0", 0)
    .required()
    .messages({
      "boolean.base": "Trạng thái phải là true hoặc false",
      "any.required": "Trạng thái là bắt buộc",
    }),

  type: Joi.string().valid("banner").required().messages({
    "any.only": "Loại banner không hợp lệ",
    "any.required": "Loại banner là bắt buộc",
  }),
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
};
