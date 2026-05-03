const Joi = require("joi");

const lineSchema = Joi.string().trim().max(255).allow("").messages({
  "string.base": "Mỗi dòng phải là chuỗi ký tự",
  "string.max": "Mỗi dòng không được vượt quá 255 ký tự",
});

const upsertReceiptSettingSchema = Joi.object({
  store_name: Joi.string().trim().max(255).allow("", null).messages({
    "string.max": "Tên cửa hàng không được vượt quá 255 ký tự",
  }),
  address: Joi.string().trim().max(255).allow("", null).messages({
    "string.max": "Địa chỉ không được vượt quá 255 ký tự",
  }),
  phone: Joi.string().trim().max(50).allow("", null).messages({
    "string.max": "Số điện thoại không được vượt quá 50 ký tự",
  }),
  header_lines: Joi.array().items(lineSchema).default([]).messages({
    "array.base": "header_lines phải là mảng chuỗi",
  }),
  footer_lines: Joi.array().items(lineSchema).default([]).messages({
    "array.base": "footer_lines phải là mảng chuỗi",
  }),
  logo_url: Joi.string().trim().max(255).allow("", null).messages({
    "string.max": "Logo URL không được vượt quá 255 ký tự",
  }),
  latitude: Joi.number().allow(null, ""),
  longitude: Joi.number().allow(null, ""),
  is_active: Joi.boolean().default(true),
  open_time: Joi.string().trim().max(10).allow("", null),
  close_time: Joi.string().trim().max(10).allow("", null),
  reputation_rules: Joi.string().allow("", null),
});

module.exports = {
  upsertReceiptSettingSchema,
};
