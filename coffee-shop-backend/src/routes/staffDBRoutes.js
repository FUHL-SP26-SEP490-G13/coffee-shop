const express = require("express");
const router = express.Router();
const controller = require("../controllers/StaffDBController");
const { authenticate } = require("../middlewares/auth");
const { isStaff } = require("../middlewares/authorize");

// Cấp quyền cho Staff/Barista/Manager (thông qua isStaff role)
router.get("/overview", authenticate, isStaff, controller.getOverview);

/**
 * @swagger
 * tags:
 *   - name: Staff D B API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /staff-db/overview:
 *   get:
 *     tags:
 *       - Staff D B API
 *     summary: Get overview
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
