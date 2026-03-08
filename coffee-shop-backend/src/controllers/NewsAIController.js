const NewsAIService = require("../services/NewsAIService");
const response = require("../utils/response");

class NewsAIController {
  async suggestByTitle(req, res, next) {
    try {
      const { title } = req.body;

      if (!title || title.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề phải có ít nhất 10 ký tự",
        });
      }

      const result = await NewsAIService.suggestFromTitle(title.trim());

      return response.success(res, result, "AI gợi ý thành công");
    } catch (error) {
      const msg = error?.message || "";

      if (
        msg.includes('"code":503') ||
        msg.includes('"status":"UNAVAILABLE"') ||
        msg.includes("503")
      ) {
        return res.status(503).json({
          success: false,
          message: "AI đang quá tải, vui lòng thử lại sau vài giây.",
        });
      }

      next(error);
    }
  }

  async suggestContentBySummary(req, res, next) {
    try {
      const { title, summary } = req.body;

      if (!title || title.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề phải có ít nhất 10 ký tự",
        });
      }

      if (!summary || summary.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Tóm tắt phải có ít nhất 10 ký tự",
        });
      }

      const result = await NewsAIService.suggestContentFromSummary(
        title.trim(),
        summary.trim()
      );

      return response.success(res, result, "AI gợi ý nội dung thành công");
    } catch (error) {
      const msg = error?.message || "";

      if (
        msg.includes('"code":503') ||
        msg.includes('"status":"UNAVAILABLE"') ||
        msg.includes("503")
      ) {
        return res.status(503).json({
          success: false,
          message: "AI đang quá tải, vui lòng thử lại sau vài giây.",
        });
      }

      next(error);
    }
  }
}

module.exports = new NewsAIController();
