const express = require('express');
const router = express.Router();
const controller = require('../controllers/AttendanceController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const MANAGER_ONLY = [ROLES_STRING.MANAGER];
const ATTENDANCE_ROLE = [ROLES_STRING.ATTENDANCE];
const ALL_STAFF = [ROLES_STRING.STAFF, ROLES_STRING.BARISTA];

// checkin/out
router.post(
  '/clock',
  authenticate,
  authorize(ATTENDANCE_ROLE),
  AsyncMiddleware(controller.clock)
);

// Staff view personal list
router.get(
  '/me',
  authenticate,
  authorize(ALL_STAFF),
  AsyncMiddleware(controller.getMyAttendance)
);

// Manager view lists
router.get(
  '/',
  authenticate,
  authorize(MANAGER_ONLY),
  AsyncMiddleware(controller.getAll)
);

// Manager manually updates attendance record
router.put(
  '/:id',
  authenticate,
  authorize(MANAGER_ONLY),
  AsyncMiddleware(controller.update)
);

module.exports = router;
