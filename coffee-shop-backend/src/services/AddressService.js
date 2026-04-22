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

  async getMyAddresses(userId) {
    return AddressRepository.findByUserId(userId);
  }



  async createAddress(userId, payload) {
    // await this.validateProvinceWard(payload.province_id, payload.ward_id);

    const current = await AddressRepository.findByUserId(userId);
    const shouldSetDefault = Number(payload.is_default) === 1 || current.length === 0;

    if (shouldSetDefault) {
      await AddressRepository.clearDefaultByUserId(userId);
    }

    const created = await AddressRepository.create({
      user_id: userId,
      receiver_name: this.normalizeNullableText(payload.receiver_name),
      receiver_phone: this.normalizeNullableText(payload.receiver_phone),
      address: payload.address.trim(),
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

    const hasProvince = payload.province_id !== undefined;
    const hasWard = payload.ward_id !== undefined;

    if (hasProvince !== hasWard) {
      throw new ErrorResponse(400, 'Cần chọn đầy đủ tỉnh/thành và xã/phường');
    }

    // if (hasProvince && hasWard) {
    //   await this.validateProvinceWard(payload.province_id, payload.ward_id);
    //   updateData.province_id = Number(payload.province_id);
    //   updateData.ward_id = Number(payload.ward_id);
    // }

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
