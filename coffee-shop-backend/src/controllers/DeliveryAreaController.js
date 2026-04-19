const DeliveryAreaService = require('../services/DeliveryAreaService');
const response = require('../utils/response');

class DeliveryAreaController {
  async getProvinces(req, res, next) {
    try {
      const provinces = await DeliveryAreaService.getProvinces();
      return response.success(res, provinces, 'Lấy danh sách tỉnh/thành thành công');
    } catch (error) {
      next(error);
    }
  }

  async createProvince(req, res, next) {
    try {
      const province = await DeliveryAreaService.createProvince(req.body);
      return response.success(res, province, 'Tạo tỉnh/thành thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async getWards(req, res, next) {
    try {
      const provinceId = Number(req.query.province_id || 0);
      const activeOnly = String(req.query.active_only || 'true') !== 'false';
      const wards = await DeliveryAreaService.getWardsByProvince(provinceId, {
        activeOnly,
      });
      return response.success(res, wards, 'Lấy danh sách xã/phường thành công');
    } catch (error) {
      next(error);
    }
  }

  async createWard(req, res, next) {
    try {
      const ward = await DeliveryAreaService.createWard(req.body);
      return response.success(res, ward, 'Tạo xã/phường thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWard(req, res, next) {
    try {
      const ward = await DeliveryAreaService.updateWard(req.params.id, req.body);
      return response.success(res, ward, 'Cập nhật xã/phường thành công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeliveryAreaController();
