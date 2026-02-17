import axiosClient from "@/services/axiosClient";

const voucherService = {
  getAll: async (params = {}) => {
    const res = await axiosClient.get("/vouchers", { params });
    return res.data; // trả toàn bộ object (items, total, totalPages...)
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/vouchers/${id}`);
    return res.data;
  },

  create: (data) => axiosClient.post("/vouchers", data),

  update: (id, data) => axiosClient.put(`/vouchers/${id}`, data),

  delete: (id) => axiosClient.delete(`/vouchers/${id}`),
};

export default voucherService;
