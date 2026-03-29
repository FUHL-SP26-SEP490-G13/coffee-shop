const AppSettingService = require("../services/AppSettingService");
const response = require("../utils/response");

class AppSettingController {
  async getAll(req, res, next) {
    try {
      const data = await AppSettingService.getAllSettings();
      return response.success(res, data, "Lấy cấu hình thành công");
    } catch (error) {
      next(error);
    }
  }

  async upsert(req, res, next) {
    try {
      // req.body should be an object of key-value pairs
      const data = await AppSettingService.upsertSettings(req.body);
      return response.success(res, data, "Cập nhật cấu hình thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppSettingController();
