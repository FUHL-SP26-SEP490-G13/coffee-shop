import axiosClient from "@/services/axiosClient";

const discountService = {
  getAll: async (params = {}, signal) => {
    const res = await axiosClient.get("/discounts", {
      params,
      signal,
    });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/discounts/${id}`);
    return res.data;
  },

  create: (data) => axiosClient.post("/discounts", data),

  update: (id, data) => axiosClient.put(`/discounts/${id}`, data),

  delete: (id) => axiosClient.delete(`/discounts/${id}`),
};

export default discountService;
