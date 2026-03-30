const ReceiptSettingRepository = require("../repositories/ReceiptSettingRepository");

class ReceiptSettingService {
  normalizePayload(data = {}) {
    return {
      store_name: data.store_name,
      address: data.address,
      phone: data.phone,
      header_lines: Array.isArray(data.header_lines) ? data.header_lines : [],
      footer_lines: Array.isArray(data.footer_lines) ? data.footer_lines : [],
      logo_url: data.logo_url,
      is_active: data.is_active,
      open_time: data.open_time,
      close_time: data.close_time,
      reputation_rules: data.reputation_rules,
    };
  }

  mapOutput(setting) {
    if (!setting) return null;

    return {
      ...setting,
      header_lines:
        typeof setting.header_lines === "string"
          ? JSON.parse(setting.header_lines || "[]")
          : setting.header_lines || [],
      footer_lines:
        typeof setting.footer_lines === "string"
          ? JSON.parse(setting.footer_lines || "[]")
          : setting.footer_lines || [],
      reputation_rules:
        typeof setting.reputation_rules === "string"
          ? setting.reputation_rules
          : JSON.stringify(setting.reputation_rules || []),
    };
  }

  async getActiveSetting() {
    const setting = await ReceiptSettingRepository.findActive();
    return this.mapOutput(setting);
  }

  async upsertActiveSetting(data) {
    const payload = this.normalizePayload(data);
    const current = await ReceiptSettingRepository.findActive();

    if (!current) {
      await ReceiptSettingRepository.deactivateAll();
      const created = await ReceiptSettingRepository.create({
        ...payload,
        is_active: true,
      });
      return this.mapOutput(created);
    }

    const updated = await ReceiptSettingRepository.updateById(current.id, {
      ...payload,
      is_active: true,
    });
    await ReceiptSettingRepository.deactivateAll(current.id);
    return this.mapOutput(updated);
  }
}

module.exports = new ReceiptSettingService();
