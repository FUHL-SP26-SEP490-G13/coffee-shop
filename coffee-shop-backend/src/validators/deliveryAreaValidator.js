const Joi = require("joi");

const listWardsQuerySchema = Joi.object({
  province_id: Joi.number().integer().positive().required().messages({
    "number.base": "Tỉnh/Thành không hợp lệ",
    "number.integer": "Tỉnh/Thành không hợp lệ",
    "number.positive": "Tỉnh/Thành không hợp lệ",
    "any.required": "Tỉnh/Thành là bắt buộc",
  }),
});

const createProvinceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Tên tỉnh/thành không được để trống",
    "string.min": "Tên tỉnh/thành không được để trống",
    "string.max": "Tên tỉnh/thành không được vượt quá 100 ký tự",
    "any.required": "Tên tỉnh/thành là bắt buộc",
  }),
});

const wardIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID xã/phường không hợp lệ",
    "number.integer": "ID xã/phường không hợp lệ",
    "number.positive": "ID xã/phường không hợp lệ",
    "any.required": "ID xã/phường là bắt buộc",
  }),
});

const createWardSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Tên xã/phường không được để trống",
    "string.min": "Tên xã/phường không được để trống",
    "string.max": "Tên xã/phường không được vượt quá 100 ký tự",
    "any.required": "Tên xã/phường là bắt buộc",
  }),
  province_id: Joi.number().integer().positive().required().messages({
    "number.base": "Tỉnh/Thành không hợp lệ",
    "number.integer": "Tỉnh/Thành không hợp lệ",
    "number.positive": "Tỉnh/Thành không hợp lệ",
    "any.required": "Tỉnh/Thành là bắt buộc",
  }),
  shipping_fee: Joi.number().min(0).required().messages({
    "number.base": "Phí giao hàng không hợp lệ",
    "number.min": "Phí giao hàng không hợp lệ",
    "any.required": "Phí giao hàng là bắt buộc",
  }),
  is_active: Joi.number().integer().valid(0, 1).optional().messages({
    "number.base": "Trạng thái hoạt động không hợp lệ",
    "any.only": "Trạng thái hoạt động không hợp lệ",
  }),
});

const updateWardSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    "string.empty": "Tên xã/phường không được để trống",
    "string.min": "Tên xã/phường không được để trống",
    "string.max": "Tên xã/phường không được vượt quá 100 ký tự",
  }),
  province_id: Joi.number().integer().positive().optional().messages({
    "number.base": "Tỉnh/Thành không hợp lệ",
    "number.integer": "Tỉnh/Thành không hợp lệ",
    "number.positive": "Tỉnh/Thành không hợp lệ",
  }),
  shipping_fee: Joi.number().min(0).optional().messages({
    "number.base": "Phí giao hàng không hợp lệ",
    "number.min": "Phí giao hàng không hợp lệ",
  }),
  is_active: Joi.number().integer().valid(0, 1).optional().messages({
    "number.base": "Trạng thái hoạt động không hợp lệ",
    "any.only": "Trạng thái hoạt động không hợp lệ",
  }),
})
  .min(1)
  .messages({
    "object.min": "Cần ít nhất 1 trường để cập nhật",
  });

module.exports = {
  createProvinceSchema,
  listWardsQuerySchema,
  wardIdParamSchema,
  createWardSchema,
  updateWardSchema,
};
