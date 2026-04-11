import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const reviewService = {
  getByProductId: (productId) =>
    axiosClient.get(API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId)),

  getMyReview: (productId) =>
    axiosClient.get(API_ENDPOINTS.REVIEWS.MY_REVIEW(productId)),

  createOrUpdate: (data) => axiosClient.post(API_ENDPOINTS.REVIEWS.BASE, data),

  getAll: (params, signal) =>
    axiosClient.get(API_ENDPOINTS.REVIEWS.BASE, {
      params,
      signal,
    }),

  getPublic: () => axiosClient.get(`${API_ENDPOINTS.REVIEWS.BASE}/public`),

  replyReview: (id, data) => 
    axiosClient.post(`${API_ENDPOINTS.REVIEWS.BASE}/admin/${id}/reply`, data),
};

export default reviewService;
