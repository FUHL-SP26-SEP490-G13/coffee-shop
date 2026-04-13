const db = require("../config/database");

class AttendanceSettingRepository {
  async findSetting() {
    const sql = `SELECT * FROM attendance_settings WHERE id = 1`;
    const [rows] = await db.query(sql);
    return rows[0] || null;
  }

  async updateSetting(data) {
    const fields = [];
    const values = [];

    if (data.early_checkin_minutes !== undefined) {
      fields.push("early_checkin_minutes = ?");
      values.push(data.early_checkin_minutes);
    }

    if (data.late_after_minutes !== undefined) {
      fields.push("late_after_minutes = ?");
      values.push(data.late_after_minutes);
    }

    if (data.max_late_minutes !== undefined) {
      fields.push("max_late_minutes = ?");
      values.push(data.max_late_minutes);
    }

    if (data.early_checkout_before_minutes !== undefined) {
      fields.push("early_checkout_before_minutes = ?");
      values.push(data.early_checkout_before_minutes);
    }

    if (fields.length === 0) {
      return this.findSetting();
    }

    values.push(1); // WHERE id = 1

    const sql = `UPDATE attendance_settings SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    return this.findSetting();
  }
}

module.exports = new AttendanceSettingRepository();
