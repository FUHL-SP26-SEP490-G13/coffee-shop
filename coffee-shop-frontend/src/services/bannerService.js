import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "../constants";

const bannerService = {
  getActive() {
    return axiosClient.get(API_ENDPOINTS.BANNERS.ACTIVE);
  },

  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.BANNERS.ADMIN, { params });
  },

  create(formData, config = {}) {
    return axiosClient.post(API_ENDPOINTS.BANNERS.ADMIN, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  },

  update(id, formData, config = {}) {
    const url = API_ENDPOINTS.BANNERS.GET_BY_ID.replace("{id}", id);
    return axiosClient.put(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  },

  delete(id) {
    const url = API_ENDPOINTS.BANNERS.GET_BY_ID.replace("{id}", id);
    return axiosClient.delete(url);
  },

  getActiveList() {
    return axiosClient.get(API_ENDPOINTS.BANNERS.ACTIVE_LIST);
  },
};

export default bannerService;
