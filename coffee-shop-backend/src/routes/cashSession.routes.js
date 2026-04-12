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

/**
 * @swagger
 * tags:
 *   - name: Cash Session API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /cash-sessions/history:
 *   get:
 *     tags:
 *       - Cash Session API
 *     summary: Get history
 *     description: Auto-generated documentation for existing route
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /cash-sessions/current:
 *   get:
 *     tags:
 *       - Cash Session API
 *     summary: Get current
 *     description: Auto-generated documentation for existing route
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /cash-sessions/open:
 *   post:
 *     tags:
 *       - Cash Session API
 *     summary: Create open
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /cash-sessions/close:
 *   post:
 *     tags:
 *       - Cash Session API
 *     summary: Create close
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
