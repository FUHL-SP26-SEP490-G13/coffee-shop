const express = require('express');
const router = express.Router();
const controller = require('../controllers/CashSessionController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

// Tất cả Cash Sessions endpoints dành cho Staff và Manager
router.use(authenticate);
router.use(authorize([ROLES_STRING.STAFF, ROLES_STRING.MANAGER]));

router.get('/history', controller.getHistory);
router.get('/current', controller.getCurrent);
router.post('/open', controller.openSession);
router.post('/close', controller.closeSession);

module.exports = router;
