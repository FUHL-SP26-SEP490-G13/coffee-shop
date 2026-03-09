export const NEWS_RULES = {
  TITLE_MIN: 10,
  TITLE_MAX: 100,
  SUMMARY_MIN: 10,
  SUMMARY_MAX: 120,
  CONTENT_MIN: 120,
  CONTENT_MAX: 5000,
  TAG_REGEX: /^#[a-zA-Z0-9_]{2,}$/,
};

export const stripHtml = (html = "") => {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const validateNewsField = (name, value, extra = {}) => {
  switch (name) {
    case "title": {
      const v = value?.trim() || "";
      if (!v) return "Tiêu đề không được để trống";
      if (v.length < NEWS_RULES.TITLE_MIN) {
        return `Tiêu đề phải có ít nhất ${NEWS_RULES.TITLE_MIN} ký tự`;
      }
      if (v.length > NEWS_RULES.TITLE_MAX) {
        return `Tiêu đề không được vượt quá ${NEWS_RULES.TITLE_MAX} ký tự`;
      }
      return "";
    }

    case "summary": {
      const v = value?.trim() || "";
      if (!v) return "Tóm tắt không được để trống";
      if (v.length < NEWS_RULES.SUMMARY_MIN) {
        return `Tóm tắt phải có ít nhất ${NEWS_RULES.SUMMARY_MIN} ký tự`;
      }
      if (v.length > NEWS_RULES.SUMMARY_MAX) {
        return `Tóm tắt không được vượt quá ${NEWS_RULES.SUMMARY_MAX} ký tự`;
      }
      return "";
    }

    case "content": {
      const plainText = stripHtml(value || "");

      if (!plainText) return "Nội dung không được để trống";

      if (plainText.length < NEWS_RULES.CONTENT_MIN) {
        return `Nội dung phải có ít nhất ${NEWS_RULES.CONTENT_MIN} ký tự`;
      }

      if (plainText.length > NEWS_RULES.CONTENT_MAX) {
        return `Nội dung không được vượt quá ${NEWS_RULES.CONTENT_MAX} ký tự`;
      }

      return "";
    }

    case "tag": {
      const v = value?.trim() || "";
      if (!v) return "Tag không được để trống";
      if (!NEWS_RULES.TAG_REGEX.test(v)) {
        return "Tag phải đúng định dạng #xx trở lên, ví dụ: #coffee hoặc #tin1";
      }
      return "";
    }

    case "thumbnail": {
      if (extra.required && !value) {
        return "Vui lòng chọn hình ảnh";
      }
      return "";
    }

    default:
      return "";
  }
};

export const validateNewsForm = (form, options = {}) => {
  const errors = {};

  const titleError = validateNewsField("title", form.title);
  if (titleError) errors.title = titleError;

  const summaryError = validateNewsField("summary", form.summary);
  if (summaryError) errors.summary = summaryError;

  const contentError = validateNewsField("content", form.content);
  if (contentError) errors.content = contentError;

  const tagError = validateNewsField("tag", form.tag);
  if (tagError) errors.tag = tagError;

  const thumbnailError = validateNewsField("thumbnail", form.thumbnail, {
    required: options.requireThumbnail,
  });
  if (thumbnailError) errors.thumbnail = thumbnailError;

  return errors;
};
