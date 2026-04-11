const Joi = require('joi');

/**
 * Validation schema for user registration
 */
const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+84|0)[0-9]{9,11}$/)
    .required()
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ (0xxx hoặc +84xxx)',
      'any.required': 'Số điện thoại là bắt buộc',
    }),

  username: Joi.string().min(3).max(50).alphanum().required().messages({
    'string.empty': 'Username không được để trống',
    'string.min': 'Username phải có ít nhất 3 ký tự',
    'string.max': 'Username không được vượt quá 50 ký tự',
    'string.alphanum': 'Username chỉ được chứa chữ và số',
    'any.required': 'Username là bắt buộc',
  }),

  password: Joi.string().min(8).max(50).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
    'string.max': 'Mật khẩu không được vượt quá 50 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),

  password_confirm: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'any.required': 'Xác nhận mật khẩu là bắt buộc',
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

  role_id: Joi.number().integer().valid(1, 2, 3, 4).optional().messages({
    'number.base': 'Role ID phải là số',
    'any.only': 'Role ID không hợp lệ',
  }),
});

/**
 * Validation schema for staff creation (admin)
 */
const staffCreateSchema = Joi.object({
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

  role_id: Joi.number().integer().valid(2, 3).required().messages({
    'number.base': 'Role ID phải là số',
    'any.only': 'Role ID không hợp lệ',
    'any.required': 'Role ID là bắt buộc',
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

  newPassword: Joi.string().min(8).max(50).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
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

/**
 * Validation schema for verify forgot password OTP
 */
const verifyForgotPasswordOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),

  otp: Joi.string().length(8).regex(/^[0-9]{8}$/).required().messages({
    'string.empty': 'OTP không được để trống',
    'string.length': 'OTP phải có 8 ký tự',
    'string.pattern.base': 'OTP chỉ chứa số',
    'any.required': 'OTP là bắt buộc',
  }),
});

/**
 * Validation schema for reset password with OTP
 */
const resetPasswordWithOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email không được để trống',
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),

  otp: Joi.string().length(8).regex(/^[0-9]{8}$/).required().messages({
    'string.empty': 'OTP không được để trống',
    'string.length': 'OTP phải có 8 ký tự',
    'string.pattern.base': 'OTP chỉ chứa số',
    'any.required': 'OTP là bắt buộc',
  }),

  newPassword: Joi.string().min(8).max(50).required().messages({
    'string.empty': 'Mật khẩu mới không được để trống',
    'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
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
 * Validation schema for create address
 */
const createAddressSchema = Joi.object({
  receiver_name: Joi.string().trim().max(100).optional().allow(null, '').messages({
    'string.max': 'Tên người nhận không được vượt quá 100 ký tự',
  }),
  receiver_phone: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Số điện thoại không được vượt quá 20 ký tự',
    }),
  address: Joi.string().trim().min(5).max(255).required().messages({
    'string.empty': 'Địa chỉ không được để trống',
    'string.min': 'Địa chỉ phải có ít nhất 5 ký tự',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
    'any.required': 'Địa chỉ là bắt buộc',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').default('home').messages({
    'any.only': 'Loại địa chỉ không hợp lệ',
  }),
  province_id: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'Tỉnh/Thành không hợp lệ',
    'number.integer': 'Tỉnh/Thành không hợp lệ',
    'number.positive': 'Tỉnh/Thành không hợp lệ',
  }),
  ward_id: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'Xã/Phường không hợp lệ',
    'number.integer': 'Xã/Phường không hợp lệ',
    'number.positive': 'Xã/Phường không hợp lệ',
  }),
  is_default: Joi.number().integer().valid(0, 1).optional(),
}).custom((value, helpers) => {
  const hasProvince = value.province_id !== undefined && value.province_id !== null;
  const hasWard = value.ward_id !== undefined && value.ward_id !== null;

  if (hasProvince !== hasWard) {
    return helpers.message('Vui lòng chọn đầy đủ cả Tỉnh/Thành và Xã/Phường');
  }

  return value;
});

/**
 * Validation schema for update address
 */
const updateAddressSchema = Joi.object({
  receiver_name: Joi.string().trim().max(100).optional().allow(null, '').messages({
    'string.max': 'Tên người nhận không được vượt quá 100 ký tự',
  }),
  receiver_phone: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Số điện thoại không được vượt quá 20 ký tự',
    }),
  address: Joi.string().trim().min(5).max(255).optional().messages({
    'string.min': 'Địa chỉ phải có ít nhất 5 ký tự',
    'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').optional().messages({
    'any.only': 'Loại địa chỉ không hợp lệ',
  }),
  province_id: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'Tỉnh/Thành không hợp lệ',
    'number.integer': 'Tỉnh/Thành không hợp lệ',
    'number.positive': 'Tỉnh/Thành không hợp lệ',
  }),
  ward_id: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'Xã/Phường không hợp lệ',
    'number.integer': 'Xã/Phường không hợp lệ',
    'number.positive': 'Xã/Phường không hợp lệ',
  }),
  is_default: Joi.number().integer().valid(0, 1).optional(),
})
  .custom((value, helpers) => {
    const hasProvince = value.province_id !== undefined && value.province_id !== null;
    const hasWard = value.ward_id !== undefined && value.ward_id !== null;

    if (hasProvince !== hasWard) {
      return helpers.message('Vui lòng chọn đầy đủ cả Tỉnh/Thành và Xã/Phường');
    }

    return value;
  })
  .min(1)
  .messages({
    'object.min': 'Cần ít nhất 1 trường để cập nhật địa chỉ',
  });

/**
 * Validation schema for address id param
 */
const addressIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID địa chỉ phải là số',
    'number.integer': 'ID địa chỉ phải là số nguyên',
    'number.positive': 'ID địa chỉ phải lớn hơn 0',
    'any.required': 'ID địa chỉ là bắt buộc',
  }),
});

module.exports = {
  registerSchema,
  staffCreateSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordWithOtpSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
};
