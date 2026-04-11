const DeliveryAreaService = require("../services/DeliveryAreaService");
const response = require("../utils/response");

class DeliveryAreaController {
  async createProvince(req, res, next) {
    try {
      const data = await DeliveryAreaService.createProvince(req.body || {});
      return response.success(res, data, "Tạo tỉnh/thành thành công", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getProvinces(req, res, next) {
    try {
      const data = await DeliveryAreaService.getProvinces();
      return response.success(res, data, "Lấy danh sách tỉnh/thành thành công");
    } catch (error) {
      return next(error);
    }
  }

  async getWards(req, res, next) {
    try {
      const data = await DeliveryAreaService.getWardsByProvince(
        req.query.province_id
      );
      return response.success(res, data, "Lấy danh sách xã/phường thành công");
    } catch (error) {
      return next(error);
    }
  }

  async createWard(req, res, next) {
    try {
      const data = await DeliveryAreaService.createWard(req.body || {});
      return response.success(res, data, "Tạo xã/phường thành công", 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateWard(req, res, next) {
    try {
      const data = await DeliveryAreaService.updateWard(
        req.params.id,
        req.body || {}
      );
      return response.success(res, data, "Cập nhật xã/phường thành công");
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new DeliveryAreaController();
