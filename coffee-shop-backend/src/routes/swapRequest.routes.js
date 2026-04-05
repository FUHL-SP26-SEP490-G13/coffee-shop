const express = require('express');
const router = express.Router();
const swapRequestController = require('../controllers/SwapRequestController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const ALL_STAFF = [ROLES_STRING.STAFF, ROLES_STRING.BARISTA];

// A gửi yêu cầu đổi/nhường ca
router.post(
    '/',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.createSwapRequest),
);

// B đồng ý → swap thực thi luôn
router.post(
    '/:id/accept',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.acceptSwapRequest),
);

// B từ chối
router.post(
    '/:id/reject',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.rejectSwapRequest),
);

// A hủy yêu cầu (chỉ khi còn pending)
router.post(
    '/:id/cancel',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.cancelSwapRequest),
);

// Lấy danh sách của mình (cả gửi lẫn nhận)
router.get(
    '/',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.getMySwapRequests),
);

// Xem chi tiết 1 yêu cầu
router.get(
    '/:id',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(swapRequestController.getSwapRequestById),
);

module.exports = router;