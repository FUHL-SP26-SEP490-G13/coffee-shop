const Joi = require("joi");

const phoneRegex = /^[0-9]{10}$/;

const checkoutOrderSchema = Joi.object({
  order_type: Joi.string().valid("delivery", "takeaway").required().messages({
    "any.only": "Hình thức nhận hàng không hợp lệ",
    "any.required": "Hình thức nhận hàng là bắt buộc",
    "string.empty": "Hình thức nhận hàng không được để trống",
  }),

  payment_method: Joi.string()
    .valid("cash", "card", "momo", "banking") //sửa cái thanh toán ở đây nhé văn dz
    .required()
    .messages({
      "any.only": "Phương thức thanh toán không hợp lệ",
      "any.required": "Phương thức thanh toán là bắt buộc",
      "string.empty": "Phương thức thanh toán không được để trống",
    }),

  receiver_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tên người nhận không được để trống",
    "any.required": "Tên người nhận là bắt buộc",
    "string.min": "Tên người nhận phải có ít nhất 2 ký tự",
    "string.max": "Tên người nhận không được vượt quá 100 ký tự",
  }),

  receiver_phone: Joi.string().trim().pattern(phoneRegex).required().messages({
    "string.empty": "Số điện thoại không được để trống",
    "any.required": "Số điện thoại là bắt buộc",
    "string.pattern.base": "Số điện thoại phải gồm đúng 10 chữ số",
  }),

  receiver_email: Joi.string()
    .trim()
    .allow("")
    .email({ tlds: false })
    .messages({
      "string.email": "Email không đúng định dạng",
    }),

  address: Joi.string().trim().allow("").max(255).messages({
    "string.max": "Địa chỉ không được vượt quá 255 ký tự",
  }),

  note: Joi.string().trim().allow("").max(500).messages({
    "string.max": "Ghi chú không được vượt quá 500 ký tự",
  }),

  items: Joi.array()
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
    }),
});

module.exports = {
  checkoutOrderSchema,
};
