import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const productService = {
  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.PRODUCTS, { params });
  },
};

export default productService;
