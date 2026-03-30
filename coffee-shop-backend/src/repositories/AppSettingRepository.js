const db = require("../config/database");

class AppSettingRepository {
  async getAll() {
    const [rows] = await db.query("SELECT * FROM app_settings");
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    return settings;
  }

  async getByKey(key) {
    const [rows] = await db.query(
      "SELECT * FROM app_settings WHERE setting_key = ?",
      [key]
    );
    return rows[0] || null;
  }

  async upsert(key, value, description = null) {
    const check = await this.getByKey(key);
    if (check) {
      await db.query(
        "UPDATE app_settings SET setting_value = ?, description = COALESCE(?, description) WHERE setting_key = ?",
        [value, description, key]
      );
    } else {
      await db.query(
        "INSERT INTO app_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
        [key, value, description]
      );
    }
  }

  async upsertMany(settings) {
    // settings is an object like { key1: value1, key2: value2 }
    for (const [key, value] of Object.entries(settings)) {
      await this.upsert(key, value);
    }
  }
}

module.exports = new AppSettingRepository();
