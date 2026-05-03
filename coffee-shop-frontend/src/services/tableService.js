import axiosClient from "./axiosClient";

const tableService = {
  getAll: async (params = {}) => {
    return axiosClient.get(`/tables`, { params });
  },

  getById: async (id) => {
    return axiosClient.get(`/tables/${id}`);
  },

  getByArea: async (areaId) => {
    return axiosClient.get(`/tables/area/${areaId}`);
  },

  create: async (data) => {
    return axiosClient.post(`/tables`, data);
  },

  createWithQr: async (data) => {
    return axiosClient.post(`/tables/with-qr`, data);
  },

  update: async (id, data) => {
    return axiosClient.put(`/tables/${id}`, data);
  },

  getActiveOrder: async (id) => {
    return axiosClient.get(`/tables/${id}/active-order`);
  },

  // reserve: async (id, data) => {
  //   return axiosClient.post(`/tables/${id}/reserve`, data);
  // },

  delete: async (id) => {
    return axiosClient.delete(`/tables/${id}`);
  },

  transfer: async (fromTableId, toTableId) => {
    return axiosClient.post(`/tables/transfer`, {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    });
  },

  transferOrder: async (fromTableId, toTableId, orderIds) => {
    const payload = {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    };

    // Support both single ID (legacy) and array of IDs
    if (Array.isArray(orderIds)) {
      payload.order_ids = orderIds;
    } else {
      payload.order_id = orderIds;
    }

    return axiosClient.post(`/tables/transfer-order`, payload);
  },

  mergeTables: async (mainTableId, tableIds = []) => {
    return axiosClient.post(`/tables/merge-group`, {
      main_table_id: mainTableId,
      table_ids: tableIds,
    });
  },

  getTableGroup: async (tableId) => {
    return axiosClient.get(`/tables/${tableId}/merge-group`);
  },

  mergeOrder: async (fromTableId, toTableId) => {
    return axiosClient.post(`/tables/merge-order`, {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    });
  },

  settleDebt: async (tableId, payload = {}) => {
    return axiosClient.post(`/tables/${tableId}/settle-debt`, payload);
  },

  splitBill: async (tableId, payload = {}) => {
    return axiosClient.post(`/tables/${tableId}/split-bill`, payload);
  },


  getUnpaidOrders: async (tableId) => {
    return axiosClient.get(`/tables/${tableId}/unpaid-orders`);
  },

  // ── Gộp bàn (Table Group) ──────────────────────────────────────
  mergeTableGroup: async (mainTableId, subTableIds = []) => {
    return axiosClient.post(`/tables/merge-group`, {
      main_table_id: mainTableId,
      sub_table_ids: subTableIds,
    });
  },

  getTableGroup: async (tableId) => {
    return axiosClient.get(`/tables/${tableId}/merge-group`);
  },

  unmergeTable: async (subTableId) => {
    return axiosClient.delete(`/tables/${subTableId}/unmerge`);
  },

  unmergeAllTables: async (mainTableId) => {
    return axiosClient.delete(`/tables/${mainTableId}/unmerge-all`);
  },

};

export default tableService;
