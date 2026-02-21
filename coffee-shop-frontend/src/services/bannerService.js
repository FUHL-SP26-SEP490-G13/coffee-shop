import axiosClient from "@/services/axiosClient";

const bannerService = {
  getActive() {
    return axiosClient.get("/banners/active");
  },

  getAll(params) {
    return axiosClient.get("/banners/admin", { params });
  },

  create(formData) {
    return axiosClient.post("/banners/admin", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id, formData) {
    return axiosClient.put(`/banners/admin/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id) {
    return axiosClient.delete(`/banners/admin/${id}`);
  },
};

export default bannerService;
