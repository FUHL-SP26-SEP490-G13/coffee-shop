const express = require("express");
const router = express.Router();

const ReputationController = require("../controllers/ReputationController");
const AsyncMiddleware = require("../middlewares/async.middleware");
const { optionalAuth, authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");

router.get(
  "/by-phone",
  optionalAuth,
  AsyncMiddleware(ReputationController.getReputationByPhone),
);

router.get(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(ReputationController.getAdminReputationProfiles),
);

router.get(
  "/admin/:phone/history",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  AsyncMiddleware(ReputationController.getAdminReputationHistory),
);

/**
 * @swagger
 * tags:
 *   - name: Reputation API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /reputation/by-phone:
 *   get:
 *     tags:
 *       - Reputation API
 *     summary: Get by phone
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
 * /reputation/admin:
 *   get:
 *     tags:
 *       - Reputation API
 *     summary: Get admin
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
 * /reputation/admin/{phone}/history:
 *   get:
 *     tags:
 *       - Reputation API
 *     summary: Get admin phone history
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: phone
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
