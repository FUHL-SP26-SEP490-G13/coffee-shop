import axiosClient from "./axiosClient";

const vietmapService = {
  autocomplete(text, focus = null, display_type = null) {
    const params = { text };
    if (focus) params.focus = focus;
    if (display_type) params.display_type = display_type;
    return axiosClient.get("/vietmap/autocomplete", { params });
  },

  getPlaceDetail(refid) {
    return axiosClient.get("/vietmap/place", {
      params: { refid },
    });
  },

  reverse(lat, lng) {
    return axiosClient.get("/vietmap/reverse", {
      params: { lat, lng },
    });
  },
};

export default vietmapService;
