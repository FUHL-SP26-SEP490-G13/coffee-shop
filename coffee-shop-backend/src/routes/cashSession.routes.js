const express = require('express');
const router = express.Router();
const cashSessionController = require('../controllers/CashSessionController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const STAFF_ROLES = [ROLES_STRING.STAFF, ROLES_STRING.MANAGER];
const ALL_ROLES = [ROLES_STRING.STAFF, ROLES_STRING.MANAGER, ROLES_STRING.BARISTA];
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
    authorize(STAFF_ROLES),
    AsyncMiddleware(cashSessionController.closeSession),
);

// Phiếu bàn giao sau khi kết ca
router.get(
    '/:id/receipt',
    authenticate,
    authorize(ALL_ROLES),
    AsyncMiddleware(cashSessionController.getReceipt),
);

// Lịch sử các ca — manager xem
router.get(
    '/',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(cashSessionController.getSessionHistory),
);

module.exports = router;