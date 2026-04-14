const AttendanceSettingService = require("../services/AttendanceSettingService");

class AttendanceSettingController {
  async getSetting(req, res) {
    const data = await AttendanceSettingService.getSetting();
    return res.json({ success: true, data });
  }

  async updateSetting(req, res) {
    const data = await AttendanceSettingService.updateSetting(req.body);
    return res.json({
      success: true,
      message: "Cập nhật cài đặt điểm danh thành công",
      data,
    });
  }
}

module.exports = new AttendanceSettingController();
