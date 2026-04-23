const ProvinceRepository = require('../repositories/ProvinceRepository');
const WardRepository = require('../repositories/WardRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class DeliveryAreaService {
  async getProvinces() {
    return ProvinceRepository.findAll();
  }

  async createProvince(payload) {
    const name = String(payload?.name || '').trim();

    if (!name) {
      throw new ErrorResponse(400, 'Tên tỉnh/thành là bắt buộc');
    }

    return ProvinceRepository.create(name);
  }

  async getWardsByProvince(provinceId, { activeOnly = true } = {}) {
    const province = await ProvinceRepository.findById(provinceId);

    if (!province) {
      throw new ErrorResponse(404, 'Tỉnh/thành không tồn tại');
    }

    return WardRepository.findByProvinceId(provinceId, { activeOnly });
  }

  async createWard(payload) {
    const name = String(payload?.name || '').trim();
    const provinceId = Number(payload?.province_id || 0);
    const isActive = payload?.is_active === undefined ? 1 : Number(payload.is_active) ? 1 : 0;

    if (!name) {
      throw new ErrorResponse(400, 'Tên xã/phường là bắt buộc');
    }

    if (!provinceId) {
      throw new ErrorResponse(400, 'Tỉnh/thành không hợp lệ');
    }

    const province = await ProvinceRepository.findById(provinceId);
    if (!province) {
      throw new ErrorResponse(404, 'Tỉnh/thành không tồn tại');
    }

    return WardRepository.create({
      name,
      province_id: provinceId,
      is_active: isActive,
    });
  }

  async updateWard(wardId, payload) {
    const normalizedWardId = Number(wardId || 0);
    if (!normalizedWardId) {
      throw new ErrorResponse(400, 'Mã xã/phường không hợp lệ');
    }

    const currentWard = await WardRepository.findById(normalizedWardId);
    if (!currentWard) {
      throw new ErrorResponse(404, 'Xã/phường không tồn tại');
    }

    const updateData = {};

    if (payload?.name !== undefined) {
      const nextName = String(payload.name || '').trim();
      if (!nextName) {
        throw new ErrorResponse(400, 'Tên xã/phường không hợp lệ');
      }
      updateData.name = nextName;
    }

    if (payload?.province_id !== undefined) {
      const provinceId = Number(payload.province_id || 0);
      if (!provinceId) {
        throw new ErrorResponse(400, 'Tỉnh/thành không hợp lệ');
      }

      const province = await ProvinceRepository.findById(provinceId);
      if (!province) {
        throw new ErrorResponse(404, 'Tỉnh/thành không tồn tại');
      }

      updateData.province_id = provinceId;
    }

    if (payload?.is_active !== undefined) {
      updateData.is_active = Number(payload.is_active) ? 1 : 0;
    }

    return WardRepository.update(normalizedWardId, updateData);
  }
}

module.exports = new DeliveryAreaService();
