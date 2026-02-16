const newsletterRepository = require("../repositories/NewsletterRepository");

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

      await newsletterRepository.create(email);

      res.json({
        success: true,
        message: "Đăng ký nhận tin thành công",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra",
      });
    }
  }
}

module.exports = new NewsletterController();
