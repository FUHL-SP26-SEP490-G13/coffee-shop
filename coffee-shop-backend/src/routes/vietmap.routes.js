const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const VietmapController = require('../controllers/VietmapController');

// Rate limiter for proxy API to prevent abuse (50 requests per minute)
const vietmapLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 requests per `window` (here, per minute)
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu tải bản đồ từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(vietmapLimiter);

router.get('/autocomplete', VietmapController.autocomplete);
router.get('/place', VietmapController.getPlaceDetail);
router.get('/reverse', VietmapController.reverse);

module.exports = router;
