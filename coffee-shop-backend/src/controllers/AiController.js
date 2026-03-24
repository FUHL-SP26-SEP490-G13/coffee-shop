const AiService = require("../services/AiService");

class AiController {
  async chat(req, res, next) {
    try {
      const { history = [], message = "", sessionId } = req.body;

      // Ưu tiên sessionId từ frontend
      const clientId =
        sessionId ||
        req.user?.id?.toString() ||   // nếu có login
        req.ip ||                     // fallback
        "guest";

      const response = await AiService.processChat(
        history,
        message,
        clientId
      );

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Controller Error:", error);
      next(error);
    }
  }
}

module.exports = new AiController();