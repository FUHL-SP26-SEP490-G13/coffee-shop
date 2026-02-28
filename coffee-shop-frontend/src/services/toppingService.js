import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const toppingService = {
  getAll(params) {
    return axiosClient.get(API_ENDPOINTS.TOPPINGS, { params });
  },

  // create a new topping
  create(data) {
    return axiosClient.post(API_ENDPOINTS.TOPPINGS, data);
  },

  // update an existing topping
  update(id, data) {
    const url = `${API_ENDPOINTS.TOPPINGS}/${id}`;
    return axiosClient.put(url, data);
  },

  // remove (soft delete) a topping
  delete(id) {
    const url = `${API_ENDPOINTS.TOPPINGS}/${id}`;
    return axiosClient.delete(url);
  }
};

export default toppingService;