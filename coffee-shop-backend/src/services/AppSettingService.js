const AppSettingRepository = require("../repositories/AppSettingRepository");

class AppSettingService {
  async getAllSettings() {
    return await AppSettingRepository.getAll();
  }

  async getSetting(key) {
    const record = await AppSettingRepository.getByKey(key);
    return record ? record.setting_value : null;
  }

  async upsertSettings(settingsObj) {
    await AppSettingRepository.upsertMany(settingsObj);
    return this.getAllSettings();
  }
}

module.exports = new AppSettingService();
