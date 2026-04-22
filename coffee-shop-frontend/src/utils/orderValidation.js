export const ORDER_RULES = {
  RECEIVER_NAME_MIN: 2,
  RECEIVER_NAME_MAX: 100,
  PHONE_REGEX: /^(0\d{9}|(?:\+84|84)\d{9})$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ADDRESS_MAX: 255,
  NOTE_MAX: 500,
  PAYMENT_METHOD_REQUIRED: true,
};

export const validateOrderField = (name, value) => {
  switch (name) {
    case "receiver_name": {
      const v = value?.trim() || "";
      if (!v) return "Tên người nhận không được để trống";
      if (v.length < ORDER_RULES.RECEIVER_NAME_MIN) {
        return `Tên người nhận phải có ít nhất ${ORDER_RULES.RECEIVER_NAME_MIN} ký tự`;
      }
      if (v.length > ORDER_RULES.RECEIVER_NAME_MAX) {
        return `Tên người nhận không được vượt quá ${ORDER_RULES.RECEIVER_NAME_MAX} ký tự`;
      }
      return "";
    }

    case "receiver_phone": {
      const v = value?.trim() || "";
      if (!v) return "Số điện thoại không được để trống";
      if (!ORDER_RULES.PHONE_REGEX.test(v)) {
        return "Số điện thoại phải gồm đúng 10 chữ số và có thể bắt đầu bằng 0 hoặc +84";
      }
      return "";
    }

    case "receiver_email": {
      const v = value?.trim() || "";
      if (!v) return "";
      if (!ORDER_RULES.EMAIL_REGEX.test(v)) {
        return "Email không đúng định dạng";
      }
      return "";
    }

    case "address": {
      const v = value?.trim() || "";
      if (!v) return "";
      if (v.length > ORDER_RULES.ADDRESS_MAX) {
        return `Địa chỉ không được vượt quá ${ORDER_RULES.ADDRESS_MAX} ký tự`;
      }
      return "";
    }

    case "note": {
      const v = value?.trim() || "";
      if (!v) return "";
      if (v.length > ORDER_RULES.NOTE_MAX) {
        return `Ghi chú không được vượt quá ${ORDER_RULES.NOTE_MAX} ký tự`;
      }
      return "";
    }

    case "payment_method": {
      const v = value?.trim() || "";
      if (!v) return "Vui lòng chọn phương thức thanh toán";
      return "";
    }

    default:
      return "";
  }
};

export const validateOrderForm = (form) => {
  const errors = {};

  const nameError = validateOrderField("receiver_name", form.receiver_name);
  if (nameError) errors.receiver_name = nameError;

  const phoneError = validateOrderField("receiver_phone", form.receiver_phone);
  if (phoneError) errors.receiver_phone = phoneError;

  const emailError = validateOrderField("receiver_email", form.receiver_email);
  if (emailError) errors.receiver_email = emailError;

  const normalizedAddress = form.address?.trim() || "";
  if (form.order_type === "delivery" && !normalizedAddress) {
    errors.address = "Địa chỉ không được để trống";
  } else {
    const addressError = validateOrderField("address", form.address);
    if (addressError) errors.address = addressError;
  }



  const noteError = validateOrderField("note", form.note);
  if (noteError) errors.note = noteError;

  const paymentError = validateOrderField(
    "payment_method",
    form.payment_method
  );
  if (paymentError) errors.payment_method = paymentError;

  return errors;
};
