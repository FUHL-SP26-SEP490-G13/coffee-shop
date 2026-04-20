const axios = require('axios');
const ErrorResponse = require('../utils/ErrorResponse');

class VietmapService {
  constructor() {
    this.apiKey = process.env.VIETMAP_API_KEY;
    this.baseUrl = 'https://maps.vietmap.vn/api';
  }

  async autocomplete(text, focus = null, display_type = null) {
    if (!this.apiKey) {
      throw new ErrorResponse(500, "Vietmap API Key is missing");
    }

    try {
      const params = {
        apikey: this.apiKey,
        text: text,
      };

      if (focus) params.focus = focus;
      if (display_type) params.display_type = display_type;

      const response = await axios.get(`${this.baseUrl}/autocomplete/v4`, {
        params,
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error("Vietmap autocomplete error:", error?.response?.data || error.message);
      throw new ErrorResponse(500, "Failed to autocomplete address with Vietmap");
    }
  }

  async getPlaceDetail(refid) {
    if (!this.apiKey) {
      throw new ErrorResponse(500, "Vietmap API Key is missing");
    }

    try {
      const response = await axios.get(`${this.baseUrl}/place/v4`, {
        params: {
          apikey: this.apiKey,
          refid: refid,
        },
        timeout: 5000,
      });

      console.log(response.data);

      return response.data;
    } catch (error) {
      console.error("Vietmap place detail error:", error?.response?.data || error.message);
      throw new ErrorResponse(500, "Failed to get place detail from Vietmap");
    }
  }
}

module.exports = new VietmapService();
