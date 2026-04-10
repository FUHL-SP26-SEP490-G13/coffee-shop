const ReceiptSettingRepository = require("../repositories/ReceiptSettingRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class ReceiptSettingService {
  normalizeNullableText(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeCoordinate(value, type) {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);

    if (!Number.isFinite(num)) {
      throw new ErrorResponse(
        400,
        `${type === "lat" ? "Vĩ độ" : "Kinh độ"} không hợp lệ`
      );
    }

    if (type === "lat" && (num < -90 || num > 90)) {
      throw new ErrorResponse(400, "Vĩ độ không hợp lệ");
    }

    if (type === "lng" && (num < -180 || num > 180)) {
      throw new ErrorResponse(400, "Kinh độ không hợp lệ");
    }

    return Number(num.toFixed(7));
  }

  normalizeLocationSource(source) {
    const normalized = String(source || "").trim().toLowerCase();
    if (["manual_pin", "gps", "geocode", "imported"].includes(normalized)) {
      return normalized;
    }
    return null;
  }

  normalizePayload(data = {}) {
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(data, key);

    return {
      store_name: hasOwn("store_name") ? data.store_name : undefined,
      address: hasOwn("address")
        ? this.normalizeNullableText(data.address)
        : undefined,
      latitude: hasOwn("latitude")
        ? this.normalizeCoordinate(data.latitude, "lat")
        : undefined,
      longitude: hasOwn("longitude")
        ? this.normalizeCoordinate(data.longitude, "lng")
        : undefined,
      location_source: hasOwn("location_source")
        ? this.normalizeLocationSource(data.location_source)
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
      latitude:
        setting.latitude === null || setting.latitude === undefined
          ? null
          : Number(setting.latitude),
      longitude:
        setting.longitude === null || setting.longitude === undefined
          ? null
          : Number(setting.longitude),
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
    const currentAddress = this.normalizeNullableText(current?.address);
    const nextAddress =
      payload.address === undefined
        ? currentAddress
        : this.normalizeNullableText(payload.address);
    const isAddressChanged = nextAddress !== currentAddress;

    const hasLat = payload.latitude !== undefined && payload.latitude !== null;
    const hasLng = payload.longitude !== undefined && payload.longitude !== null;

    if (hasLat !== hasLng) {
      throw new ErrorResponse(400, "Vui lòng cung cấp đầy đủ cả vĩ độ và kinh độ");
    }

    if (isAddressChanged && nextAddress && (!hasLat || !hasLng)) {
      throw new ErrorResponse(
        400,
        "Bạn vừa thay đổi địa chỉ cửa hàng, vui lòng ghim lại tọa độ"
      );
    }

    if (isAddressChanged && nextAddress && hasLat && hasLng) {
      payload.location_verified_at = new Date();
      payload.location_source = payload.location_source || "manual_pin";
    }

    if (!isAddressChanged && hasLat && hasLng) {
      payload.location_verified_at = new Date();
      payload.location_source = payload.location_source || current?.location_source || "manual_pin";
    }

    if (!current) {
      if (nextAddress && (!hasLat || !hasLng)) {
        throw new ErrorResponse(400, "Vui lòng ghim tọa độ cho địa chỉ cửa hàng");
      }

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
