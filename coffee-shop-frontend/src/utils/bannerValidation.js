export const BANNER_RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 50,
  SUBTITLE_MIN: 10,
  SUBTITLE_MAX: 120,
  BUTTON_TEXT_MIN: 3,
  BUTTON_TEXT_MAX: 20,
  BUTTON_LINK_REGEX: /^(\/[a-zA-Z0-9\-_/]*|(https?:\/\/)[^\s]+)$/,
};

export const validateBannerField = (name, value, extra = {}) => {
  switch (name) {
    case "title": {
      const v = value?.trim() || "";
      if (!v) return "Tiêu đề không được để trống";
      if (v.length < BANNER_RULES.TITLE_MIN) {
        return `Tiêu đề phải có ít nhất ${BANNER_RULES.TITLE_MIN} ký tự`;
      }
      if (v.length > BANNER_RULES.TITLE_MAX) {
        return `Tiêu đề không được vượt quá ${BANNER_RULES.TITLE_MAX} ký tự`;
      }
      return "";
    }

    case "subtitle": {
      const v = value?.trim() || "";
      if (v && v.length < BANNER_RULES.SUBTITLE_MIN) {
        return `Mô tả phải có ít nhất ${BANNER_RULES.SUBTITLE_MIN} ký tự`;
      }
      if (v.length > BANNER_RULES.SUBTITLE_MAX) {
        return `Mô tả không được vượt quá ${BANNER_RULES.SUBTITLE_MAX} ký tự`;
      }
      return "";
    }

    case "button_text": {
      const v = value?.trim() || "";
      if (v && v.length < BANNER_RULES.BUTTON_TEXT_MIN) {
        return `Text nút phải có ít nhất ${BANNER_RULES.BUTTON_TEXT_MIN} ký tự`;
      }
      if (v.length > BANNER_RULES.BUTTON_TEXT_MAX) {
        return `Text nút không được vượt quá ${BANNER_RULES.BUTTON_TEXT_MAX} ký tự`;
      }
      return "";
    }

    case "button_link": {
      const v = value?.trim() || "";
      if (!v) return "Link nút không được để trống";
      if (!BANNER_RULES.BUTTON_LINK_REGEX.test(v)) {
        return "Link phải có dạng /products hoặc https://example.com";
      }
      return "";
    }

    case "start_date": {
      if (!value) return "Ngày bắt đầu là bắt buộc";
      if (Number.isNaN(new Date(value).getTime())) {
        return "Ngày bắt đầu không hợp lệ";
      }
      return "";
    }

    case "end_date": {
      if (!value) return "Ngày kết thúc là bắt buộc";
      if (Number.isNaN(new Date(value).getTime())) {
        return "Ngày kết thúc không hợp lệ";
      }

      if (extra.start_date) {
        const start = new Date(extra.start_date);
        const end = new Date(value);

        if (
          !Number.isNaN(start.getTime()) &&
          !Number.isNaN(end.getTime()) &&
          end < start
        ) {
          return "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu";
        }
      }

      return "";
    }

    case "image": {
      if (extra.required && !value) {
        return "Ảnh quảng cáo là bắt buộc";
      }
      return "";
    }

    default:
      return "";
  }
};

export const validateBannerForm = (form, options = {}) => {
  const errors = {};

  const titleError = validateBannerField("title", form.title);
  if (titleError) errors.title = titleError;

  const subtitleError = validateBannerField("subtitle", form.subtitle);
  if (subtitleError) errors.subtitle = subtitleError;

  const buttonTextError = validateBannerField("button_text", form.button_text);
  if (buttonTextError) errors.button_text = buttonTextError;

  const buttonLinkError = validateBannerField("button_link", form.button_link);
  if (buttonLinkError) errors.button_link = buttonLinkError;

  const startDateError = validateBannerField("start_date", form.start_date);
  if (startDateError) errors.start_date = startDateError;

  const endDateError = validateBannerField("end_date", form.end_date, {
    start_date: form.start_date,
  });
  if (endDateError) errors.end_date = endDateError;

  const imageError = validateBannerField("image", form.image, {
    required: options.requireImage,
  });
  if (imageError) errors.image = imageError;

  return errors;
};
