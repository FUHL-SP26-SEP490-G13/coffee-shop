const AttendanceSettingRepository = require("../repositories/AttendanceSettingRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class AttendanceSettingService {

  async getSetting() {
    const setting = await AttendanceSettingRepository.findSetting();
    if (!setting) {
      throw new ErrorResponse(404, "Chưa có thông tin cài đặt điểm danh");
    }
    return setting;
  }

  async updateSetting(data) {
    const allowedFields = [
      { key: "early_checkin_minutes", label: "Check-in sớm tối đa" },
      { key: "late_after_minutes", label: "Tính muộn sau" },
    ];

    const payload = {};

    for (const field of allowedFields) {
      if (data[field.key] !== undefined) {
        const value = Number(data[field.key]);
        if (!Number.isInteger(value) || value < 0) {
          throw new ErrorResponse(
            400,
            `${field.label} phải là số nguyên không âm`
          );
        }
        payload[field.key] = value;
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new ErrorResponse(400, "Không có dữ liệu hợp lệ để cập nhật");
    }

    const current = await AttendanceSettingRepository.findSetting();
    if (!current) {
      throw new ErrorResponse(404, "Không tìm thấy cấu hình điểm danh để cập nhật");
    }

    const updated = await AttendanceSettingRepository.updateSetting(payload);
    return updated;
  }
}

module.exports = new AttendanceSettingService();
