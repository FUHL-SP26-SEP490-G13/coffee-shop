import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const reviewService = {
  getByProductId: (productId) =>
    axiosClient.get(API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId)),

  getMyReview: (productId) =>
    axiosClient.get(API_ENDPOINTS.REVIEWS.MY_REVIEW(productId)),

  createOrUpdate: (data) => axiosClient.post(API_ENDPOINTS.REVIEWS.BASE, data),
};

export default reviewService;
