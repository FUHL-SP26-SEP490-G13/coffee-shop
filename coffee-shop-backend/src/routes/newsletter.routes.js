const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/NewsletterController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require("../config/constants");

// Cổng chung
router.post('/subscribe', newsletterController.subscribe.bind(newsletterController));
router.get('/unsubscribe', newsletterController.unsubscribe.bind(newsletterController));

// Cổng Admin
router.get('/', authenticate, authorize([ROLES_STRING.MANAGER]), newsletterController.getAll.bind(newsletterController));
router.put('/:id/toggle', authenticate, authorize([ROLES_STRING.MANAGER]), newsletterController.toggleActive.bind(newsletterController));
router.post('/broadcast', authenticate, authorize([ROLES_STRING.MANAGER]), newsletterController.broadcast.bind(newsletterController));

module.exports = router;
