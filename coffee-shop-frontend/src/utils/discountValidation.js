export const DISCOUNT_RULES = {
  CODE_MAX: 50,
  DESCRIPTION_MAX: 255,
};

export const validateDiscountField = (name, value, all = {}) => {
  const trimValue = typeof value === "string" ? value.trim() : value;

  const toNumber = (x) => {
    if (x === "" || x === null || x === undefined) return NaN;
    return Number(x);
  };

  switch (name) {
    case "code": {
      if (!trimValue) return "Mã giảm giá không được để trống";
      if (trimValue.length > 50) return "Mã giảm giá tối đa 50 ký tự";
      return "";
    }

    case "description": {
      if (!trimValue) return "Mô tả không được để trống";
      if (trimValue.length > 255) return "Mô tả tối đa 255 ký tự";
      return "";
    }

    case "percentage": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Phần trăm là bắt buộc";
      }
      if (Number.isNaN(n)) return "Phần trăm phải là số";
      if (n < 0) return "Phần trăm phải >= 0";
      if (n > 100) return "Phần trăm phải <= 100";
      return "";
    }

    case "min_order_amount": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Đơn tối thiểu là bắt buộc";
      }
      if (Number.isNaN(n)) return "Đơn tối thiểu phải là số";
      if (n < 0) return "Đơn tối thiểu phải >= 0";
      return "";
    }

    case "max_discount_amount": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Giảm tối đa là bắt buộc";
      }
      if (Number.isNaN(n)) return "Giảm tối đa phải là số";
      if (n < 0) return "Giảm tối đa phải >= 0";
      return "";
    }

    case "usage_limit": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Giới hạn lượt là bắt buộc";
      }
      if (Number.isNaN(n)) return "Giới hạn lượt phải là số";
      if (!Number.isInteger(n)) return "Giới hạn lượt phải là số nguyên";
      if (n < 0) return "Giới hạn lượt phải >= 0";
      return "";
    }

    case "valid_from": {
      if (!value) return "Ngày bắt đầu là bắt buộc";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "Ngày bắt đầu không hợp lệ";
      return "";
    }

    case "valid_until": {
      if (!value) return "Ngày kết thúc là bắt buộc";
      const end = new Date(value);
      if (Number.isNaN(end.getTime())) return "Ngày kết thúc không hợp lệ";

      if (all.valid_from) {
        const start = new Date(all.valid_from);
        if (!Number.isNaN(start.getTime()) && start >= end) {
          return "Ngày kết thúc phải sau ngày bắt đầu";
        }
      }

      return "";
    }

    default:
      return "";
  }
};

export const validateDiscountForm = (form) => {
  const errors = {};

  [
    "code",
    "description",
    "percentage",
    "min_order_amount",
    "max_discount_amount",
    "usage_limit",
    "valid_from",
    "valid_until",
  ].forEach((field) => {
    const error = validateDiscountField(field, form[field], form);
    if (error) errors[field] = error;
  });

  return errors;
};
