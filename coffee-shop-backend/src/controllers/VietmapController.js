const VietmapService = require('../services/VietmapService');
const ErrorResponse = require('../utils/ErrorResponse');

class VietmapController {
  async autocomplete(req, res, next) {
    try {
      const { text, focus, display_type } = req.query;
      if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, message: 'Text query is required' });
      }

      if (text.length > 200) {
        return res.status(400).json({ success: false, message: 'Query text too long' });
      }

      const result = await VietmapService.autocomplete(text, focus, display_type);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getPlaceDetail(req, res, next) {
    try {
      const { refid } = req.query;
      if (!refid || refid.trim() === '') {
        return res.status(400).json({ success: false, message: 'refid is required' });
      }

      const result = await VietmapService.getPlaceDetail(refid);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VietmapController();
