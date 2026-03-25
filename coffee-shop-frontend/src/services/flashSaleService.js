import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const flashSaleService = {
  getCurrentActive: () => axiosClient.get(API_ENDPOINTS.FLASH_SALES.CURRENT),
};

export default flashSaleService;
