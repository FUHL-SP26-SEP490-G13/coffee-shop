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
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftTemplateController.create),
);

router.put(
    '/templates/:id',
    authenticate,
    authorize(MANAGER_ONLY),
    AsyncMiddleware(shiftTemplateController.update),
);

router.delete(
    '/templates/:id',
    authenticate,
    authorize(MANAGER_ONLY),
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

/**
 * @swagger
 * tags:
 *   - name: Shift API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /shifts/templates:
 *   get:
 *     tags:
 *       - Shift API
 *     summary: Get templates
 *     description: Auto-generated documentation for existing route
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/templates:
 *   post:
 *     tags:
 *       - Shift API
 *     summary: Create templates
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/templates/{id}:
 *   put:
 *     tags:
 *       - Shift API
 *     summary: Update templates id
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/templates/{id}:
 *   delete:
 *     tags:
 *       - Shift API
 *     summary: Delete templates id
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/assign:
 *   post:
 *     tags:
 *       - Shift API
 *     summary: Create assign
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/assign-bulk:
 *   post:
 *     tags:
 *       - Shift API
 *     summary: Create assign bulk
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/registrations/{id}:
 *   delete:
 *     tags:
 *       - Shift API
 *     summary: Delete registrations id
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/schedule:
 *   get:
 *     tags:
 *       - Shift API
 *     summary: Get schedule
 *     description: Auto-generated documentation for existing route
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /shifts/schedule/me:
 *   get:
 *     tags:
 *       - Shift API
 *     summary: Get schedule me
 *     description: Auto-generated documentation for existing route
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;