const express = require('express');
const router = express.Router();
const takeAwayController = require('../controllers/TakeawayController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const STAFF_ROLES = [
  ROLES_STRING.STAFF,
  ROLES_STRING.MANAGER,
  ROLES_STRING.MANAGER,
];
const BARISTA_ROLES = [
  ROLES_STRING.BARISTA,
  ROLES_STRING.MANAGER,
  ROLES_STRING.MANAGER,
];
const ALL_ROLES = [...new Set([...STAFF_ROLES, ...BARISTA_ROLES])];

// Tạo đơn + thanh toán gộp luôn
router.post(
  '/orders',
  authenticate,
  authorize(STAFF_ROLES),
  AsyncMiddleware(takeAwayController.createOrder),
);

// Sửa đơn (pending only, kể cả đã paid)
router.put(
  '/orders/:id',
  authenticate,
  authorize(STAFF_ROLES),
  AsyncMiddleware(takeAwayController.updateOrder),
);

// Hủy đơn (pending only, kể cả đã paid)
router.delete(
  '/orders/:id/cancel',
  authenticate,
  authorize(STAFF_ROLES),
  AsyncMiddleware(takeAwayController.cancelOrder),
);

// Lấy hóa đơn
router.get(
  '/orders/:id/receipt',
  authenticate,
  authorize(ALL_ROLES),
  AsyncMiddleware(takeAwayController.getReceipt),
);

// Barista nhận đơn
router.post(
  '/orders/:id/assign',
  authenticate,
  authorize(BARISTA_ROLES),
  AsyncMiddleware(takeAwayController.assignOrder),
);

// Barista làm xong
router.post(
  '/orders/:id/served',
  authenticate,
  authorize(BARISTA_ROLES),
  AsyncMiddleware(takeAwayController.markServed),
);

// Staff giao khách
router.post(
  '/orders/:id/complete',
  authenticate,
  authorize(STAFF_ROLES),
  AsyncMiddleware(takeAwayController.markCompleted),
);

module.exports = router;
