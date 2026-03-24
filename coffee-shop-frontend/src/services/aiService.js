import axiosClient from "@/services/axiosClient";
import { API_ENDPOINTS } from "@/constants";

const aiService = {
  chat: (history, message) =>
    axiosClient.post(API_ENDPOINTS.AI.CHAT, { history, message }),
};

export default aiService;
