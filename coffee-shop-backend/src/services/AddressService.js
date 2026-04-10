const AddressRepository = require('../repositories/AddressRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const { ADDRESS_TYPES } = require('../config/constants');

class AddressService {
  normalizeNullableText(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeAddressType(type) {
    const normalized = String(type || '').toLowerCase();

    if (normalized === ADDRESS_TYPES.HOME) return ADDRESS_TYPES.HOME;
    if (normalized === ADDRESS_TYPES.WORK) return ADDRESS_TYPES.WORK;
    if (normalized === ADDRESS_TYPES.OTHER) return ADDRESS_TYPES.OTHER;

    return ADDRESS_TYPES.HOME;
  }

  normalizeCoordinate(value, type) {
    if (value === null || value === undefined || value === "") return null;

    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new ErrorResponse(400, `${type === "lat" ? "Vĩ độ" : "Kinh độ"} không hợp lệ`);
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
    return "manual_pin";
  }

  async getMyAddresses(userId) {
    return AddressRepository.findByUserId(userId);
  }

  async createAddress(userId, payload) {
    const current = await AddressRepository.findByUserId(userId);
    const shouldSetDefault = Number(payload.is_default) === 1 || current.length === 0;

    if (shouldSetDefault) {
      await AddressRepository.clearDefaultByUserId(userId);
    }

    const latitude = this.normalizeCoordinate(payload.latitude, "lat");
    const longitude = this.normalizeCoordinate(payload.longitude, "lng");

    if (latitude === null || longitude === null) {
      throw new ErrorResponse(400, "Vui lòng ghim vị trí để lấy tọa độ địa chỉ");
    }

    const created = await AddressRepository.create({
      user_id: userId,
      receiver_name: this.normalizeNullableText(payload.receiver_name),
      receiver_phone: this.normalizeNullableText(payload.receiver_phone),
      address: payload.address.trim(),
      latitude,
      longitude,
      location_source: this.normalizeLocationSource(payload.location_source),
      location_verified_at: new Date(),
      address_type: this.normalizeAddressType(payload.address_type),
      is_default: shouldSetDefault ? 1 : 0,
      is_deleted: 0,
    });

    return created;
  }

  async updateAddress(userId, addressId, payload) {
    const existing = await AddressRepository.findByIdAndUser(addressId, userId);

    if (!existing) {
      throw new ErrorResponse(404, 'Địa chỉ không tồn tại');
    }

    const updateData = {};

    if (typeof payload.receiver_name === 'string') {
      updateData.receiver_name = this.normalizeNullableText(payload.receiver_name);
    }

    if (payload.receiver_name === null) {
      updateData.receiver_name = null;
    }

    if (typeof payload.receiver_phone === 'string') {
      updateData.receiver_phone = this.normalizeNullableText(payload.receiver_phone);
    }

    if (payload.receiver_phone === null) {
      updateData.receiver_phone = null;
    }

    if (typeof payload.address === 'string') {
      updateData.address = payload.address.trim();
    }

    const hasLatInput = payload.latitude !== undefined && payload.latitude !== null;
    const hasLngInput = payload.longitude !== undefined && payload.longitude !== null;

    if (hasLatInput !== hasLngInput) {
      throw new ErrorResponse(400, 'Vui lòng cung cấp đầy đủ cả vĩ độ và kinh độ');
    }

    const hasAddressInput = typeof payload.address === 'string';
    const newAddress = hasAddressInput ? payload.address.trim() : existing.address;
    const oldAddress = String(existing.address || '').trim();
    const isAddressChanged = hasAddressInput && newAddress !== oldAddress;

    if (isAddressChanged && !hasLatInput) {
      throw new ErrorResponse(400, 'Khi thay đổi địa chỉ, vui lòng ghim tọa độ mới');
    }

    if (hasLatInput && hasLngInput) {
      updateData.latitude = this.normalizeCoordinate(payload.latitude, 'lat');
      updateData.longitude = this.normalizeCoordinate(payload.longitude, 'lng');
      updateData.location_source = this.normalizeLocationSource(payload.location_source);
      updateData.location_verified_at = new Date();
    }

    if (typeof payload.address_type === 'string') {
      updateData.address_type = this.normalizeAddressType(payload.address_type);
    }

    const shouldSetDefault = Number(payload.is_default) === 1;

    if (shouldSetDefault) {
      await AddressRepository.clearDefaultByUserId(userId);
      updateData.is_default = 1;
    }

    const updated = await AddressRepository.update(addressId, updateData);

    return updated;
  }

  async deleteAddress(userId, addressId) {
    const target = await AddressRepository.findByIdAndUser(addressId, userId);

    if (!target) {
      throw new ErrorResponse(404, 'Địa chỉ không tồn tại');
    }

    await AddressRepository.softDeleteByIdAndUser(addressId, userId);

    const remaining = await AddressRepository.findByUserId(userId);
    const hasDefault = remaining.some((item) => Number(item.is_default) === 1);

    if (!hasDefault && remaining.length > 0) {
      await AddressRepository.clearDefaultByUserId(userId);
      await AddressRepository.update(remaining[0].id, { is_default: 1 });
    }

    return true;
  }

  async setDefaultAddress(userId, addressId) {
    const target = await AddressRepository.findByIdAndUser(addressId, userId);

    if (!target) {
      throw new ErrorResponse(404, 'Địa chỉ không tồn tại');
    }

    await AddressRepository.clearDefaultByUserId(userId);
    await AddressRepository.update(addressId, { is_default: 1 });

    return AddressRepository.findByIdAndUser(addressId, userId);
  }
}

module.exports = new AddressService();
