const ReceiptSettingRepository = require("../repositories/ReceiptSettingRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class ReceiptSettingService {
  normalizeNullableText(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizePayload(data = {}) {
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(data, key);

    return {
      store_name: hasOwn("store_name") ? data.store_name : undefined,
      address: hasOwn("address")
        ? this.normalizeNullableText(data.address)
        : undefined,
      latitude: hasOwn("latitude") 
        ? (data.latitude !== null && data.latitude !== "" ? Number(String(data.latitude).replace(",", ".")) : null) 
        : undefined,
      longitude: hasOwn("longitude") 
        ? (data.longitude !== null && data.longitude !== "" ? Number(String(data.longitude).replace(",", ".")) : null) 
        : undefined,
      phone: hasOwn("phone") ? data.phone : undefined,
      header_lines: hasOwn("header_lines")
        ? Array.isArray(data.header_lines)
          ? data.header_lines
          : []
        : undefined,
      footer_lines: hasOwn("footer_lines")
        ? Array.isArray(data.footer_lines)
          ? data.footer_lines
          : []
        : undefined,
      logo_url: hasOwn("logo_url") ? data.logo_url : undefined,
      is_active: hasOwn("is_active") ? data.is_active : undefined,
      open_time: hasOwn("open_time") ? data.open_time : undefined,
      close_time: hasOwn("close_time") ? data.close_time : undefined,
      reputation_rules: hasOwn("reputation_rules") ? data.reputation_rules : undefined,
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
