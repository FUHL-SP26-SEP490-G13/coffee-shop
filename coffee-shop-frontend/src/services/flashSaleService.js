import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const flashSaleService = {
  getCurrentActive: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.FLASH_SALES.CURRENT);
    if (res?.data) {
      if (typeof res.data.product_ids === 'string') {
        try {
          res.data.product_ids = JSON.parse(res.data.product_ids);
        } catch (e) {
          res.data.product_ids = [];
        }
      }
      if (!Array.isArray(res.data.product_ids)) {
        res.data.product_ids = [];
      }
      res.data.discount_percent = Number(res.data.discount_percent) || 0;
    }
    return res;
  },
};

export default flashSaleService;
