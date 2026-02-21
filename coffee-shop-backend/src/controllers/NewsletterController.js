const newsletterService = require("../services/NewsletterService");

class NewsletterController {
  async subscribe(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      await newsletterService.subscribe(email);

      res.json({
        success: true,
        message: "Đăng ký nhận tin thành công",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Có lỗi xảy ra",
      });
    }
  }

  async getAll(req, res) {
    try {
      const data = await newsletterService.getAll();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("GET ALL ERROR:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      await newsletterService.delete(req.params.id);

      res.json({
        success: true,
        message: "Xóa thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra",
      });
    }
  }
}

module.exports = new NewsletterController();
