const Joi = require("joi");

const phoneRegex = /^(0\d{9}|(?:\+84|84)\d{9})$/;

const itemsSchema = Joi.array()
  .items(
    Joi.object({
      product_size_id: Joi.number().integer().positive().required().messages({
        "number.base": "product_size_id không hợp lệ",
        "number.integer": "product_size_id không hợp lệ",
        "number.positive": "product_size_id không hợp lệ",
        "any.required": "Thiếu product_size_id",
      }),

      quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "Số lượng không hợp lệ",
        "number.integer": "Số lượng không hợp lệ",
        "number.min": "Số lượng phải lớn hơn 0",
        "any.required": "Thiếu số lượng sản phẩm",
      }),

      toppings: Joi.array()
        .items(
          Joi.object({
            topping_id: Joi.number()
              .integer()
              .positive()
              .required()
              .messages({
                "number.base": "topping_id không hợp lệ",
                "number.integer": "topping_id không hợp lệ",
                "number.positive": "topping_id không hợp lệ",
                "any.required": "Thiếu topping_id",
              }),
            quantity: Joi.number().integer().min(1).required().messages({
              "number.base": "Số lượng topping không hợp lệ",
              "number.integer": "Số lượng topping không hợp lệ",
              "number.min": "Số lượng topping phải lớn hơn 0",
              "any.required": "Thiếu số lượng topping",
            }),
          })
        )
        .default([]),
    })
  )
  .min(1)
  .required()
  .messages({
    "array.base": "Danh sách sản phẩm không hợp lệ",
    "array.min": "Giỏ hàng trống",
    "any.required": "Giỏ hàng trống",
  });

const checkoutOrderSchema = Joi.object({
  order_type: Joi.string()
    .valid("delivery", "takeaway", "dine-in")
    .required()
    .messages({
      "any.only": "Hình thức nhận hàng không hợp lệ",
      "any.required": "Hình thức nhận hàng là bắt buộc",
      "string.empty": "Hình thức nhận hàng không được để trống",
    }),

  table_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "Mã bàn không hợp lệ",
    "number.integer": "Mã bàn không hợp lệ",
    "number.positive": "Mã bàn không hợp lệ",
  }),

  table_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ""),

  payment_method: Joi.string()
    .valid("cash", "payos")
    .required()
    .messages({
      "any.only": "Phương thức thanh toán không hợp lệ",
      "any.required": "Phương thức thanh toán là bắt buộc",
      "string.empty": "Phương thức thanh toán không được để trống",
    }),

  cash_received: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .allow(null, "")
    .optional()
    .messages({
      "alternatives.match": "Số tiền khách đưa không hợp lệ",
    }),

  receiver_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tên người nhận không được để trống",
    "any.required": "Tên người nhận là bắt buộc",
    "string.min": "Tên người nhận phải có ít nhất 2 ký tự",
    "string.max": "Tên người nhận không được vượt quá 100 ký tự",
  }),

  receiver_phone: Joi.alternatives().conditional('order_type', {
    is: 'dine-in',
    then: Joi.string().trim().allow("").custom((value, helpers) => {
      if (value && !phoneRegex.test(value)) {
        return helpers.error("string.pattern.base");
      }
      return value;
    }).messages({
      "string.pattern.base": "Số điện thoại phải gồm đúng 10 chữ số",
    }),
    otherwise: Joi.string().trim().pattern(phoneRegex).required().messages({
      "string.empty": "Số điện thoại không được để trống",
      "any.required": "Số điện thoại là bắt buộc",
      "string.pattern.base": "Số điện thoại phải gồm đúng 10 chữ số",
    })
  }),

  receiver_email: Joi.string()
    .trim()
    .allow("")
    .email({ tlds: false })
    .messages({
      "string.email": "Email không đúng định dạng",
    }),

  address: Joi.alternatives().conditional("order_type", {
    is: "delivery",
    then: Joi.string().trim().min(1).max(255).required().messages({
      "string.empty": "Địa chỉ không được để trống",
      "string.min": "Địa chỉ không được để trống",
      "any.required": "Địa chỉ là bắt buộc",
      "string.max": "Địa chỉ không được vượt quá 255 ký tự",
    }),
    otherwise: Joi.string().trim().allow("").max(255).messages({
      "string.max": "Địa chỉ không được vượt quá 255 ký tự",
    }),
  }),

  customer_latitude: Joi.alternatives().conditional("order_type", {
    is: "delivery",
    then: Joi.number().min(-90).max(90).required().messages({
      "number.base": "Vĩ độ giao hàng không hợp lệ",
      "number.min": "Vĩ độ giao hàng không hợp lệ",
      "number.max": "Vĩ độ giao hàng không hợp lệ",
      "any.required": "Vui lòng ghim vị trí giao hàng",
    }),
    otherwise: Joi.number().min(-90).max(90).allow(null).optional(),
  }),

  customer_longitude: Joi.alternatives().conditional("order_type", {
    is: "delivery",
    then: Joi.number().min(-180).max(180).required().messages({
      "number.base": "Kinh độ giao hàng không hợp lệ",
      "number.min": "Kinh độ giao hàng không hợp lệ",
      "number.max": "Kinh độ giao hàng không hợp lệ",
      "any.required": "Vui lòng ghim vị trí giao hàng",
    }),
    otherwise: Joi.number().min(-180).max(180).allow(null).optional(),
  }),

  customer_location_source: Joi.string()
    .valid("manual_pin", "gps", "geocode")
    .allow("", null)
    .optional()
    .messages({
      "any.only": "Nguồn tọa độ giao hàng không hợp lệ",
    }),

  note: Joi.string().trim().allow("").max(500).messages({
    "string.max": "Ghi chú không được vượt quá 500 ký tự",
  }),

  discount_code: Joi.string().trim().allow("").max(50).messages({
    "string.max": "Mã giảm giá không được vượt quá 50 ký tự",
  }),

  used_points: Joi.number().integer().min(0).optional().messages({
    "number.base": "Điểm sử dụng không hợp lệ",
    "number.integer": "Điểm sử dụng phải là số nguyên",
    "number.min": "Điểm sử dụng không được âm",
  }),

  items: itemsSchema,
});

const validateDiscountSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    "string.empty": "Mã giảm giá không được để trống",
    "any.required": "Mã giảm giá là bắt buộc",
  }),
  items: itemsSchema,
});

module.exports = {
  checkoutOrderSchema,
  validateDiscountSchema,
};
