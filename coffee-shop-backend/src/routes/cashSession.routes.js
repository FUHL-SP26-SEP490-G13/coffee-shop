const express = require('express');
const router = express.Router();
const cashSessionController = require('../controllers/CashSessionController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const STAFF_ROLES = [ROLES_STRING.STAFF];
const ALL_ROLES = [ROLES_STRING.STAFF, ROLES_STRING.MANAGER];
const MANAGER_ONLY = [ROLES_STRING.MANAGER];

// Mở ca mới
router.post(
    '/open',
    authenticate,
    authorize(STAFF_ROLES),
    AsyncMiddleware(cashSessionController.openSession),
);

// Lấy ca đang open (dùng để gắn session_id vào order, hiển thị header)
router.get(
    '/current',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getCurrentSession),
);

// Lấy ca làm việc hiện tại của nhân viên (để hiển thị lúc mở ca)
router.get(
    '/my-shift',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getMyCurrentShift),
);

// Xem tổng hợp realtime trong ca
router.get(
    '/:id/summary',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getSessionSummary),
);

// Kết ca
router.post(
    '/:id/close',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.closeSession),
);

// Manager đóng ca hộ
router.post(
    '/:id/force-close',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(cashSessionController.forceCloseSession),
);

// Phiếu bàn giao sau khi kết ca
router.get(
    '/:id/receipt',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getReceipt),
);

// Lịch sử các ca của riêng nhân viên
router.get(
    '/my-history',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getMySessionHistory),
);

// Lịch sử tất cả các ca — manager xem
router.get(
    '/',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(cashSessionController.getSessionHistory),
);

module.exports = router;