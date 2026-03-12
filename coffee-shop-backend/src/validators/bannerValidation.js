const Joi = require("joi");

const bannerBaseSchema = {
  title: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "any.required": "Tiêu đề là bắt buộc",
    "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
    "string.max": "Tiêu đề không được vượt quá 50 ký tự",
  }),

  subtitle: Joi.string()
    .allow("")
    .max(120)
    .custom((value, helpers) => {
      if (value && value.trim() !== "" && value.trim().length < 10) {
        return helpers.error("string.min");
      }
      return value;
    })
    .messages({
      "string.min": "Mô tả phải có ít nhất 10 ký tự",
      "string.max": "Mô tả không được vượt quá 120 ký tự",
    }),

  button_text: Joi.string()
    .allow("")
    .max(20)
    .custom((value, helpers) => {
      if (value && value.trim() !== "" && value.trim().length < 3) {
        return helpers.error("string.min");
      }
      return value;
    })
    .messages({
      "string.min": "Text nút phải có ít nhất 3 ký tự",
      "string.max": "Text nút không được vượt quá 20 ký tự",
    }),

  button_link: Joi.string()
    .pattern(/^(\/[a-zA-Z0-9\-_/]*|(https?:\/\/)[^\s]+)$/)
    .required()
    .messages({
      "string.empty": "Link nút không được để trống",
      "any.required": "Link nút là bắt buộc",
      "string.pattern.base":
        "Link phải có dạng /products hoặc https://example.com",
    }),

  start_date: Joi.date().required().messages({
    "date.base": "Ngày bắt đầu không hợp lệ",
    "any.required": "Ngày bắt đầu là bắt buộc",
  }),

  end_date: Joi.date().required().messages({
    "date.base": "Ngày kết thúc không hợp lệ",
    "any.required": "Ngày kết thúc là bắt buộc",
  }),

  type: Joi.string().valid("banner").required().messages({
    "any.only": "Loại banner không hợp lệ",
    "any.required": "Loại banner là bắt buộc",
  }),
};

const createBannerSchema = Joi.object(bannerBaseSchema).custom(
  (value, helpers) => {
    if (new Date(value.end_date) < new Date(value.start_date)) {
      return helpers.message(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );
    }
    return value;
  }
);

const updateBannerSchema = Joi.object(bannerBaseSchema).custom(
  (value, helpers) => {
    if (new Date(value.end_date) < new Date(value.start_date)) {
      return helpers.message(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );
    }
    return value;
  }
);

module.exports = {
  createBannerSchema,
  updateBannerSchema,
};
