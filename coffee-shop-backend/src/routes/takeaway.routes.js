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

// router.put(
//   '/orders/:id',
//   authenticate,
//   authorize(STAFF_ROLES),
//   AsyncMiddleware(takeAwayController.updateOrder),
// );

// router.delete(
//   '/orders/:id/cancel',
//   authenticate,
//   authorize(STAFF_ROLES),
//   AsyncMiddleware(takeAwayController.cancelOrder),
// );

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

/**
 * @swagger
 * tags:
 *   - name: Takeaway API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /takeaway/orders:
 *   post:
 *     tags:
 *       - Takeaway API
 *     summary: Create orders
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
 * /takeaway/orders/{id}/receipt:
 *   get:
 *     tags:
 *       - Takeaway API
 *     summary: Get orders id receipt
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
 * /takeaway/orders/{id}/assign:
 *   post:
 *     tags:
 *       - Takeaway API
 *     summary: Create orders id assign
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
 * /takeaway/orders/{id}/served:
 *   post:
 *     tags:
 *       - Takeaway API
 *     summary: Create orders id served
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
 * /takeaway/orders/{id}/complete:
 *   post:
 *     tags:
 *       - Takeaway API
 *     summary: Create orders id complete
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

module.exports = router;
