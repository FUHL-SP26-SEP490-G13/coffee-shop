import axiosClient from "./axiosClient";

const deliveryAreaService = {
  getProvinces() {
    return axiosClient.get("/delivery-areas/provinces");
  },

  createProvince(payload) {
    return axiosClient.post("/delivery-areas/provinces", payload);
  },

  getWardsByProvince(provinceId) {
    return axiosClient.get("/delivery-areas/wards", {
      params: {
        province_id: provinceId,
      },
    });
  },

  createWard(payload) {
    return axiosClient.post("/delivery-areas/wards", payload);
  },

  updateWard(wardId, payload) {
    return axiosClient.put(`/delivery-areas/wards/${wardId}`, payload);
  },
};

export default deliveryAreaService;
