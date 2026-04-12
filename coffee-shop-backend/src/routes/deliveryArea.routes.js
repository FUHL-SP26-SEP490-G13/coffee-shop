const express = require("express");
const router = express.Router();

const DeliveryAreaController = require("../controllers/DeliveryAreaController");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const {
  createProvinceSchema,
  listWardsQuerySchema,
  wardIdParamSchema,
  createWardSchema,
  updateWardSchema,
} = require("../validators/deliveryAreaValidator");

router.get("/provinces", DeliveryAreaController.getProvinces);
router.post(
  "/provinces",
  authenticate,
  authorize(["manager"]),
  validate(createProvinceSchema),
  DeliveryAreaController.createProvince
);

router.get(
  "/wards",
  validate(listWardsQuerySchema, "query"),
  DeliveryAreaController.getWards
);

router.post(
  "/wards",
  authenticate,
  authorize(["manager"]),
  validate(createWardSchema),
  DeliveryAreaController.createWard
);

router.put(
  "/wards/:id",
  authenticate,
  authorize(["manager"]),
  validate(wardIdParamSchema, "params"),
  validate(updateWardSchema),
  DeliveryAreaController.updateWard
);

/**
 * @swagger
 * tags:
 *   - name: Delivery Area API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /delivery-areas/provinces:
 *   get:
 *     tags:
 *       - Delivery Area API
 *     summary: Get provinces
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
 * /delivery-areas/provinces:
 *   post:
 *     tags:
 *       - Delivery Area API
 *     summary: Create provinces
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
 * /delivery-areas/wards:
 *   get:
 *     tags:
 *       - Delivery Area API
 *     summary: Get wards
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
 * /delivery-areas/wards:
 *   post:
 *     tags:
 *       - Delivery Area API
 *     summary: Create wards
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
 * /delivery-areas/wards/{id}:
 *   put:
 *     tags:
 *       - Delivery Area API
 *     summary: Update wards id
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
