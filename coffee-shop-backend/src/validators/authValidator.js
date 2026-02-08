const Joi = require('joi');

/**
 * Validation schema for user registration
 */
const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
      'any.required': 'Số điện thoại là bắt buộc',
    }),

  username: Joi.string().min(3).max(50).alphanum().required().messages({
    'string.empty': 'Username không được để trống',
    'string.min': 'Username phải có ít nhất 3 ký tự',
    'string.max': 'Username không được vượt quá 50 ký tự',
    'string.alphanum': 'Username chỉ được chứa chữ và số',
    'any.required': 'Username là bắt buộc',
  }),

  password: Joi.string().min(6).max(50).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'string.max': 'Mật khẩu không được vượt quá 50 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),

  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),

  first_name: Joi.string().min(1).max(30).required().messages({
    'string.empty': 'Họ không được để trống',
    'string.max': 'Họ không được vượt quá 30 ký tự',
    'any.required': 'Họ là bắt buộc',
  }),

  last_name: Joi.string().min(1).max(30).required().messages({
    'string.empty': 'Tên không được để trống',
    'string.max': 'Tên không được vượt quá 30 ký tự',
    'any.required': 'Tên là bắt buộc',
  }),

  gender: Joi.number().integer().valid(0, 1).optional().allow(null).messages({
    'number.base': 'Giới tính phải là số',
    'any.only': 'Giới tính không hợp lệ (0: Nữ, 1: Nam)',
  }),

  dob: Joi.date().iso().max('now').required().messages({
    'date.base': 'Ngày sinh không hợp lệ',
    'date.max': 'Ngày sinh không được là tương lai',
    'any.required': 'Ngày sinh là bắt buộc',
  }),

  address: Joi.string().max(255).optional().allow(null, ''),

  role_id: Joi.number().integer().valid(1, 2, 3, 4).optional().messages({
    'number.base': 'Role ID phải là số',
    'any.only': 'Role ID không hợp lệ',
  }),
});

/**
 * Validation schema for user login
 */
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': 'Email/Username không được để trống',
    'any.required': 'Email/Username là bắt buộc',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

/**
 * Validation schema for change password
 */
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Mật khẩu cũ không được để trống',
    'any.required': 'Mật khẩu cũ là bắt buộc',
  }),

  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
    'string.max': 'Mật khẩu mới không được vượt quá 50 ký tự',
    'any.required': 'Mật khẩu mới là bắt buộc',
  }),

  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.empty': 'Xác nhận mật khẩu không được để trống',
    'any.only': 'Xác nhận mật khẩu không khớp',
    'any.required': 'Xác nhận mật khẩu là bắt buộc',
  }),
});

/**
 * Validation schema for update profile
 */
const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(1).max(30).optional().messages({
    'string.empty': 'Họ không được để trống',
    'string.max': 'Họ không được vượt quá 30 ký tự',
  }),

  last_name: Joi.string().min(1).max(30).optional().messages({
    'string.empty': 'Tên không được để trống',
    'string.max': 'Tên không được vượt quá 30 ký tự',
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
    }),

  gender: Joi.number().integer().valid(0, 1).optional().allow(null).messages({
    'number.base': 'Giới tính phải là số',
    'any.only': 'Giới tính không hợp lệ (0: Nữ, 1: Nam)',
  }),

  dob: Joi.date().iso().max('now').optional().messages({
    'date.base': 'Ngày sinh không hợp lệ',
    'date.max': 'Ngày sinh không được là tương lai',
  }),

  address: Joi.string().max(255).optional().allow(null, ''),
});

/**
 * Validation schema for refresh token
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token không được để trống',
    'any.required': 'Refresh token là bắt buộc',
  }),
});

/**
 * Validation schema for reset password
 */
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
  resetPasswordSchema,
};
