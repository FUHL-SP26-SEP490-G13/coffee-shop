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
  latitude: Joi.number().min(-90).max(90).allow(null).messages({
    "number.base": "Vĩ độ không hợp lệ",
    "number.min": "Vĩ độ không hợp lệ",
    "number.max": "Vĩ độ không hợp lệ",
  }),
  longitude: Joi.number().min(-180).max(180).allow(null).messages({
    "number.base": "Kinh độ không hợp lệ",
    "number.min": "Kinh độ không hợp lệ",
    "number.max": "Kinh độ không hợp lệ",
  }),
  location_source: Joi.string()
    .valid("manual_pin", "gps", "geocode", "imported")
    .allow("", null)
    .messages({
      "any.only": "Nguồn tọa độ không hợp lệ",
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
  is_active: Joi.boolean().default(true),
  open_time: Joi.string().trim().max(10).allow("", null),
  close_time: Joi.string().trim().max(10).allow("", null),
  reputation_rules: Joi.string().allow("", null),
}).custom((value, helpers) => {
  const hasLat = value.latitude !== undefined && value.latitude !== null;
  const hasLng = value.longitude !== undefined && value.longitude !== null;

  if (hasLat !== hasLng) {
    return helpers.message("Vui lòng cung cấp đầy đủ cả vĩ độ và kinh độ");
  }

  return value;
});

module.exports = {
  upsertReceiptSettingSchema,
};
