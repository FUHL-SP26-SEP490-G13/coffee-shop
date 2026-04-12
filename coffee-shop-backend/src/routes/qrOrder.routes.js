const express = require("express");
const router = express.Router();
const qrOrderController = require("../controllers/QrOrderController");

// /api/qr-order
router.post("/checkout", qrOrderController.checkout);

/**
 * @swagger
 * tags:
 *   - name: Qr Order API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /qr-order/checkout:
 *   post:
 *     tags:
 *       - Qr Order API
 *     summary: Create checkout
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
