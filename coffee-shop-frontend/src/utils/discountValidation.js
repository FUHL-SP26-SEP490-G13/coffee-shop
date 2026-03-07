export const DISCOUNT_RULES = {
  CODE_MIN: 3,
  CODE_MAX: 50,
  DESCRIPTION_MIN: 3,
  DESCRIPTION_MAX: 255,
};

export const getCountText = (current, min) => `${current}/${min}`;

export const validateDiscountField = (name, value, all = {}) => {
  const v = typeof value === "string" ? value.trim() : value;

  const toNumber = (x) => {
    if (x === "" || x === null || x === undefined) return NaN;
    return Number(x);
  };

  switch (name) {
    case "code": {
      const s = v || "";
      if (!s) return "Mã giảm giá không được để trống";
      if (s.length < 3) return "Mã giảm giá tối thiểu 3 ký tự";
      if (s.length > 50) return "Mã giảm giá tối đa 50 ký tự";
      return "";
    }

    case "description": {
      const s = v || "";
      if (!s) return "Mô tả không được để trống";
      if (s.length < 3) return "Mô tả tối thiểu 3 ký tự";
      if (s.length > 255) return "Mô tả tối đa 255 ký tự";
      return "";
    }

    case "percentage": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Phần trăm là bắt buộc";
      }
      if (Number.isNaN(n)) return "Phần trăm phải là số";
      if (n < 1) return "Phần trăm phải >= 1";
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

      if (all.min_order_amount !== "" && all.min_order_amount !== null) {
        const minOrder = Number(all.min_order_amount);
        if (!Number.isNaN(minOrder) && n > minOrder) {
          return "Giảm tối đa không được lớn hơn đơn tối thiểu";
        }
      }

      return "";
    }

    case "usage_limit": {
      const n = toNumber(value);
      if (value === "" || value === null || value === undefined) {
        return "Giới hạn lượt là bắt buộc";
      }
      if (Number.isNaN(n)) return "Giới hạn lượt phải là số";
      if (!Number.isInteger(n)) return "Giới hạn lượt phải là số nguyên";
      if (n < 1) return "Giới hạn lượt phải >= 1";
      if (n > 1000) return "Giới hạn lượt phải <= 1000";
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
        if (!Number.isNaN(start.getTime()) && end <= start) {
          return "Ngày kết thúc phải sau ngày bắt đầu";
        }
      }

      return "";
    }

    case "is_active":
      return "";

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
    "is_active",
  ].forEach((field) => {
    const error = validateDiscountField(field, form[field], form);
    if (error) errors[field] = error;
  });

  return errors;
};
