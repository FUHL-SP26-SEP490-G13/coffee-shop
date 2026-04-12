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

// Lấy danh sách của tất cả (dành cho Admin/Manager)
router.get(
    '/all',
    authenticate,
    authorize([ROLES_STRING.MANAGER]),
    AsyncMiddleware(swapRequestController.getAllSwapRequests),
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

/**
 * @swagger
 * tags:
 *   - name: Swap Request API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /swap-requests/:
 *   post:
 *     tags:
 *       - Swap Request API
 *     summary: Create resource
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
 * /swap-requests/{id}/accept:
 *   post:
 *     tags:
 *       - Swap Request API
 *     summary: Create id accept
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
 * /swap-requests/{id}/reject:
 *   post:
 *     tags:
 *       - Swap Request API
 *     summary: Create id reject
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
 * /swap-requests/{id}/cancel:
 *   post:
 *     tags:
 *       - Swap Request API
 *     summary: Create id cancel
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
 * /swap-requests/all:
 *   get:
 *     tags:
 *       - Swap Request API
 *     summary: Get all
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
 * /swap-requests/:
 *   get:
 *     tags:
 *       - Swap Request API
 *     summary: Get resource
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
 * /swap-requests/{id}:
 *   get:
 *     tags:
 *       - Swap Request API
 *     summary: Get id
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

module.exports = router;