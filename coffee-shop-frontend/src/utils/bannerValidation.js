export const BANNER_RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 50,
  SUBTITLE_MIN: 10,
  SUBTITLE_MAX: 120,
  BUTTON_TEXT_MIN: 3,
  BUTTON_TEXT_MAX: 20,
  BUTTON_LINK_MIN: 3,
  BUTTON_LINK_MAX: 100,
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

      if (!v) return "Mô tả không được để trống";
      if (v.length < BANNER_RULES.SUBTITLE_MIN) {
        return `Mô tả phải có ít nhất ${BANNER_RULES.SUBTITLE_MIN} ký tự`;
      }
      if (v.length > BANNER_RULES.SUBTITLE_MAX) {
        return `Mô tả không được vượt quá ${BANNER_RULES.SUBTITLE_MAX} ký tự`;
      }

      return "";
    }

    case "button_text": {
      const v = value?.trim() || "";

      if (!v) return "Text nút không được để trống";
      if (v.length < BANNER_RULES.BUTTON_TEXT_MIN) {
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

      const internalPath = /^\/[a-zA-Z0-9\-_/]*$/;
      const fullUrl = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/;

      if (!internalPath.test(v) && !fullUrl.test(v)) {
        return "Link phải có dạng /products hoặc https://example.com";
      }

      if (v.length > BANNER_RULES.BUTTON_LINK_MAX) {
        return `Link nút không được vượt quá ${BANNER_RULES.BUTTON_LINK_MAX} ký tự`;
      }

      return "";
    }

    case "is_active": {
      if (typeof value !== "boolean") {
        return "Trạng thái phải là true hoặc false";
      }
      return "";
    }

    case "image": {
      if (extra.required && !value) {
        return "Ảnh banner là bắt buộc";
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

  const statusError = validateBannerField("is_active", form.is_active);
  if (statusError) errors.is_active = statusError;

  const imageError = validateBannerField("image", form.image, {
    required: options.requireImage,
  });
  if (imageError) errors.image = imageError;

  return errors;
};
