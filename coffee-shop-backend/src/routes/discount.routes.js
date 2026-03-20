const express = require("express");
const router = express.Router();

const DiscountController = require("../controllers/DiscountController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const {
  createDiscountSchema,
  updateDiscountSchema,
} = require("../validators/discountValidator");
const { ROLES_STRING } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   - name: Discounts
 *     description: Discount/coupon code management endpoints (admin only)
 */

/**
 * @swagger
 * /discounts:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: Get all discounts
 *     description: Retrieve list of all discount codes (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Discounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags:
 *       - Discounts
 *     summary: Create discount
 *     description: Create a new discount code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - maxUsage
 *             properties:
 *               code:
 *                 type: string
 *                 example: DISCOUNT10
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *                 format: float
 *               maxUsage:
 *                 type: integer
 *               minOrderValue:
 *                 type: number
 *                 format: float
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /discounts/{id}:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: Get discount by ID
 *     description: Retrieve details of a specific discount code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Discount details retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Discounts
 *     summary: Update discount
 *     description: Update an existing discount code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxUsage:
 *                 type: integer
 *               minOrderValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Discounts
 *     summary: Delete discount
 *     description: Delete a discount code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

router.get(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.getById
);

router.post(
  "/",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  validate(createDiscountSchema),
  DiscountController.create
);

router.put(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  validate(updateDiscountSchema),
  DiscountController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  DiscountController.delete
);

module.exports = router;
