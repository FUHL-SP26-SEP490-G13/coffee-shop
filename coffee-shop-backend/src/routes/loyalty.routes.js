const express = require("express");
const router = express.Router();

const LoyaltyController = require("../controllers/LoyaltyController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

router.get(
  "/me",
  authenticate,
  AsyncMiddleware(LoyaltyController.getMyLoyalty)
);

router.get(
  "/me/transactions",
  authenticate,
  AsyncMiddleware(LoyaltyController.getMyTransactions)
);

router.get(
  "/admin/customers",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.listCustomers)
);

router.get(
  "/admin/users/:userId",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.getCustomerDetail)
);

router.get(
  "/admin/users/:userId/transactions",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.getCustomerTransactions)
);

router.post(
  "/admin/users/:userId/adjust",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(LoyaltyController.adjustCustomerPoints)
);

/**
 * @swagger
 * tags:
 *   - name: Loyalty API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /loyalty/me:
 *   get:
 *     tags:
 *       - Loyalty API
 *     summary: Get me
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
 * /loyalty/me/transactions:
 *   get:
 *     tags:
 *       - Loyalty API
 *     summary: Get me transactions
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
 * /loyalty/admin/customers:
 *   get:
 *     tags:
 *       - Loyalty API
 *     summary: Get admin customers
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
 * /loyalty/admin/users/{userId}:
 *   get:
 *     tags:
 *       - Loyalty API
 *     summary: Get admin users userId
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: userId
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
 * /loyalty/admin/users/{userId}/transactions:
 *   get:
 *     tags:
 *       - Loyalty API
 *     summary: Get admin users userId transactions
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: userId
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
 * /loyalty/admin/users/{userId}/adjust:
 *   post:
 *     tags:
 *       - Loyalty API
 *     summary: Create admin users userId adjust
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: userId
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
