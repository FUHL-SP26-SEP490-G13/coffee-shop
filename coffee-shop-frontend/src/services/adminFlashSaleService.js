import axiosClient from "./axiosClient";

export const adminFlashSaleService = {
  getAll: () => {
    return axiosClient.get("/flash-sales/admin/list");
  },
  
  getById: (id) => {
    return axiosClient.get(`/flash-sales/admin/${id}`);
  },
  
  create: (data) => {
    return axiosClient.post("/flash-sales/admin", data);
  },
  
  update: (id, data) => {
    return axiosClient.put(`/flash-sales/admin/${id}`, data);
  },
  
  delete: (id) => {
    return axiosClient.delete(`/flash-sales/admin/${id}`);
  }
};
