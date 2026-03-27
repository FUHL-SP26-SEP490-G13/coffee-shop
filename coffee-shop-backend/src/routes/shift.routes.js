const express = require('express');
const router = express.Router();
const shiftTemplateController = require('../controllers/ShiftTemplateController');
const shiftController = require('../controllers/ShiftController');
const AsyncMiddleware = require('../middlewares/async.middleware');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

const MANAGER_ONLY = [ROLES_STRING.MANAGER];
const ALL_STAFF = [ROLES_STRING.MANAGER, ROLES_STRING.STAFF, ROLES_STRING.BARISTA];

// ================ SHIFT TEMPLATES ===============
router.get(
    '/templates',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(shiftTemplateController.getAll),
);

router.post(
    '/templates',
    // authenticate,
    // authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftTemplateController.create),
);

router.put(
    '/templates/:id',
    // authenticate,
    // authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftTemplateController.update),
);

router.delete(
    '/templates/:id',
    // authenticate,
    // authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftTemplateController.remove),
);

// =========== SHIFT ASSIGNMENT =====================
// Gán ca từng ngày lẻ 
router.post(
    '/assign',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftController.assignSingle),
);

// Gán ca hàng loạt theo tuần
router.post(
    '/assign-bulk',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftController.assignBulk),
);

// Xóa nhân viên khỏi ca (1 registration cụ thể)
router.delete(
    '/registrations/:id',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftController.removeRegistration),
);

// LỊCH LÀM VIỆC TỔNG QUAN
router.get(
    '/schedule',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(shiftController.getSchedule),
);

// Lấy lịch của 1 nhân viên cụ thể
// GET /shifts/schedule/me?start_date=...&end_date=...
router.get(
    '/schedule/me',
    authenticate,
    authorize(ALL_STAFF),
    AsyncMiddleware(shiftController.getMySchedule),
);

module.exports = router;