const ProvinceRepository = require("../repositories/ProvinceRepository");
const WardRepository = require("../repositories/WardRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class DeliveryAreaService {
  normalizePositiveInt(value, fieldName) {
    const normalized = Number(value);

    if (!Number.isInteger(normalized) || normalized <= 0) {
      throw new ErrorResponse(400, `${fieldName} không hợp lệ`);
    }

    return normalized;
  }

  async getProvinces() {
    return ProvinceRepository.findAll();
  }

  async createProvince(data = {}) {
    const name = String(data.name || "").trim();

    if (!name) {
      throw new ErrorResponse(400, "Tên tỉnh/thành không được để trống");
    }

    const allProvinces = await ProvinceRepository.findAll();
    const existed = allProvinces.find(
      (item) => String(item.name || "").trim().toLowerCase() === name.toLowerCase()
    );

    if (existed) {
      throw new ErrorResponse(400, "Tỉnh/Thành đã tồn tại");
    }

    return ProvinceRepository.create(name);
  }

  async getWardsByProvince(provinceId) {
    const normalizedProvinceId = this.normalizePositiveInt(
      provinceId,
      "Tỉnh/Thành"
    );

    const province = await ProvinceRepository.findById(normalizedProvinceId);
    if (!province) {
      throw new ErrorResponse(404, "Tỉnh/Thành không tồn tại");
    }

    return WardRepository.findByProvinceId(normalizedProvinceId, {
      activeOnly: true,
    });
  }

  async getDeliverableWard({ wardId, provinceId, connection = null }) {
    const normalizedWardId = this.normalizePositiveInt(wardId, "Xã/Phường");
    const normalizedProvinceId = this.normalizePositiveInt(
      provinceId,
      "Tỉnh/Thành"
    );

    const ward = await WardRepository.findActiveByIdAndProvince(
      normalizedWardId,
      normalizedProvinceId,
      connection
    );

    if (!ward) {
      throw new ErrorResponse(
        400,
        "Địa chỉ không thuộc khu vực giao hàng hoặc đã tạm ngưng phục vụ"
      );
    }

    return ward;
  }

  async createWard(data = {}) {
    const payload = {
      name: String(data.name || "").trim(),
      province_id: this.normalizePositiveInt(data.province_id, "Tỉnh/Thành"),
      shipping_fee: Math.max(0, Number(data.shipping_fee) || 0),
      is_active: Number(data.is_active) === 0 ? 0 : 1,
    };

    if (!payload.name) {
      throw new ErrorResponse(400, "Tên xã/phường không được để trống");
    }

    const province = await ProvinceRepository.findById(payload.province_id);
    if (!province) {
      throw new ErrorResponse(404, "Tỉnh/Thành không tồn tại");
    }

    return WardRepository.create(payload);
  }

  async updateWard(id, data = {}) {
    const wardId = this.normalizePositiveInt(id, "Xã/Phường");

    const existing = await WardRepository.findById(wardId);
    if (!existing) {
      throw new ErrorResponse(404, "Xã/Phường không tồn tại");
    }

    const payload = {};

    if (data.name !== undefined) {
      const name = String(data.name || "").trim();
      if (!name) {
        throw new ErrorResponse(400, "Tên xã/phường không được để trống");
      }
      payload.name = name;
    }

    if (data.province_id !== undefined) {
      payload.province_id = this.normalizePositiveInt(
        data.province_id,
        "Tỉnh/Thành"
      );
      const province = await ProvinceRepository.findById(payload.province_id);
      if (!province) {
        throw new ErrorResponse(404, "Tỉnh/Thành không tồn tại");
      }
    }

    if (data.shipping_fee !== undefined) {
      const shippingFee = Number(data.shipping_fee);
      if (!Number.isFinite(shippingFee) || shippingFee < 0) {
        throw new ErrorResponse(400, "Phí giao hàng không hợp lệ");
      }
      payload.shipping_fee = shippingFee;
    }

    if (data.is_active !== undefined) {
      payload.is_active = Number(data.is_active) === 0 ? 0 : 1;
    }

    return WardRepository.update(wardId, payload);
  }
}

module.exports = new DeliveryAreaService();
