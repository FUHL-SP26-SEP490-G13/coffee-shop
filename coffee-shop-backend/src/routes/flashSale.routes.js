const express = require("express");
const router = express.Router();
const FlashSaleController = require("../controllers/FlashSaleController");
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

// Public route
router.get("/current", FlashSaleController.getCurrentActive);

// Admin routes
router.get("/admin/list", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.getAll);
router.post("/admin", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.create);
router.get("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.getById);
router.put("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.update);
router.delete("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.delete);

/**
 * @swagger
 * tags:
 *   - name: Flash Sale API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /flash-sales/current:
 *   get:
 *     tags:
 *       - Flash Sale API
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
 * /flash-sales/admin/list:
 *   get:
 *     tags:
 *       - Flash Sale API
 *     summary: Get admin list
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
 * /flash-sales/admin:
 *   post:
 *     tags:
 *       - Flash Sale API
 *     summary: Create admin
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
 * /flash-sales/admin/{id}:
 *   get:
 *     tags:
 *       - Flash Sale API
 *     summary: Get admin id
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
 * /flash-sales/admin/{id}:
 *   put:
 *     tags:
 *       - Flash Sale API
 *     summary: Update admin id
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
 * /flash-sales/admin/{id}:
 *   delete:
 *     tags:
 *       - Flash Sale API
 *     summary: Delete admin id
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
