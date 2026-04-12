const ReceiptSettingService = require("../services/ReceiptSettingService");

class ReceiptSettingController {
  async getActive(req, res, next) {
    try {
      const data = await ReceiptSettingService.getActiveSetting();
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async upsertActive(req, res, next) {
    try {
      const payload = {
        ...req.body,
      };

      if (req.file?.path) {
        payload.logo_url = req.file.path;
      }

      const data = await ReceiptSettingService.upsertActiveSetting(payload);
      return res.json({
        success: true,
        message: "Cập nhật cài đặt in hóa đơn thành công",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ReceiptSettingController();
