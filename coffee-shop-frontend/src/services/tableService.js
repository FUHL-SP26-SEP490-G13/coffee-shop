import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../constants";

const tableService = {
  getAll: async (params = {}) => {
    return axiosClient.get(API_ENDPOINTS.TABLES, { params });
  },

  getById: async (id) => {
    return axiosClient.get(`${API_ENDPOINTS.TABLES}/${id}`);
  },

  getByArea: async (areaId) => {
    return axiosClient.get(`${API_ENDPOINTS.TABLES}/area/${areaId}`);
  },

  create: async (data) => {
    return axiosClient.post(API_ENDPOINTS.TABLES, data);
  },

  createWithQr: async (data) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/with-qr`, data);
  },

  update: async (id, data) => {
    return axiosClient.put(`${API_ENDPOINTS.TABLES}/${id}`, data);
  },

  getActiveOrder: async (id) => {
    return axiosClient.get(`${API_ENDPOINTS.TABLES}/${id}/active-order`);
  },

  delete: async (id) => {
    return axiosClient.delete(`${API_ENDPOINTS.TABLES}/${id}`);
  },

  transfer: async (fromTableId, toTableId) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/transfer`, {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    });
  },

  transferOrder: async (fromTableId, toTableId, orderId) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/transfer-order`, {
      from_table_id: fromTableId,
      to_table_id: toTableId,
      order_id: orderId,
    });
  },

  mergeTables: async (mainTableId, tableIds = []) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/merge-group`, {
      main_table_id: mainTableId,
      table_ids: tableIds,
    });
  },

  getTableGroup: async (tableId) => {
    return axiosClient.get(`${API_ENDPOINTS.TABLES}/${tableId}/merge-group`);
  },

  mergeOrder: async (fromTableId, toTableId) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/merge-order`, {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    });
  },

  settleDebt: async (tableId, payload = {}) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/${tableId}/settle-debt`, payload);
  },

  splitBill: async (tableId, payload = {}) => {
    return axiosClient.post(`${API_ENDPOINTS.TABLES}/${tableId}/split-bill`, payload);
  },

  getUnpaidOrders: async (tableId) => {
    return axiosClient.get(`${API_ENDPOINTS.TABLES}/${tableId}/unpaid-orders`);
  },

};

export default tableService;

