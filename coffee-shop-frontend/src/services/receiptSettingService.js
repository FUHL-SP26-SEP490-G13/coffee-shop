import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const ACTIVE_SETTING_TTL_MS = 60_000;
let activeSettingCache = {
  value: undefined,
  expiresAt: 0,
  inFlight: null,
};

const getActiveDeduped = ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && activeSettingCache.value !== undefined && activeSettingCache.expiresAt > now) {
    return Promise.resolve(activeSettingCache.value);
  }

  if (!force && activeSettingCache.inFlight) {
    return activeSettingCache.inFlight;
  }

  activeSettingCache.inFlight = axiosClient
    .get(API_ENDPOINTS.RECEIPT_SETTINGS.BASE)
    .then((res) => {
      activeSettingCache.value = res;
      activeSettingCache.expiresAt = Date.now() + ACTIVE_SETTING_TTL_MS;
      return res;
    })
    .finally(() => {
      activeSettingCache.inFlight = null;
    });

  return activeSettingCache.inFlight;
};

const receiptSettingService = {
  getActive() {
    return getActiveDeduped();
  },

  upsert(data) {
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, data);
  },

  getSettings() {
    return getActiveDeduped();
  },
  
  upsertSettings(data) {
    const formData = new FormData();
    if (data.reputation_rules !== undefined) {
      formData.append("reputation_rules", data.reputation_rules);
    }
    return axiosClient.put(API_ENDPOINTS.RECEIPT_SETTINGS.ADMIN, formData);
  }
};

export default receiptSettingService;
