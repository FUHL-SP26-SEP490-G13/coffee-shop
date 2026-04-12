const express = require('express');
const router = express.Router();
const TableController = require('../controllers/TableController');
const { createTableSchema, updateTableSchema, tableIdSchema } = require('../validators/tableValidator');
const validate = require('../middlewares/validate');

/**
 * @swagger
 * tags:
 *   - name: Tables
 *     description: Dining table management endpoints
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     tags:
 *       - Tables
 *     summary: Get all tables
 *     description: Retrieve list of all dining tables
 *     responses:
 *       200:
 *         description: Tables retrieved successfully
 *   post:
 *     tags:
 *       - Tables
 *     summary: Create table
 *     description: Create a new dining table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *               - capacity
 *               - areaId
 *             properties:
 *               tableNumber:
 *                 type: string
 *                 example: "A1"
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               areaId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, maintenance]
 *     responses:
 *       201:
 *         description: Table created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /tables/area/{areaId}:
 *   get:
 *     tags:
 *       - Tables
 *     summary: Get tables by area
 *     description: Retrieve all tables in a specific area
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tables retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     tags:
 *       - Tables
 *     summary: Update table
 *     description: Update table information or status
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
 *               tableNumber:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               areaId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved, maintenance]
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Tables
 *     summary: Delete table
 *     description: Delete a dining table
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// Helper to validate request body/params
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};

router.get('/', TableController.getAllTables);
router.get('/area/:areaId', TableController.getTablesByArea);
router.post('/', validateRequest(createTableSchema), TableController.createTable);
router.post('/transfer', TableController.transferTable);
router.post('/merge-order', TableController.mergeOrders);
router.post('/:id/settle-debt', TableController.settleTableDebt);
// router.post('/:id/reserve', TableController.reserveTable);
router.get('/:id/active-order', TableController.getActiveOrder);
router.get('/:id/unpaid-orders', TableController.getUnpaidOrders);
router.put('/:id', validateRequest(updateTableSchema), TableController.updateTable);

// API cập nhật QR code cho bàn đã có sẵn
router.put('/:id/update-qr', TableController.updateQrForTable);
router.delete('/:id', TableController.deleteTable);

router.post('/with-qr', validate(createTableSchema), TableController.createTableWithQrCode);

// Split bill logic
router.post(
  '/:id/split-bill',
  TableController.splitBill
);

/**
 * @swagger
 * tags:
 *   - name: Table API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /tables/:
 *   get:
 *     tags:
 *       - Table API
 *     summary: Get resource
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
 * /tables/:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create resource
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

/**
 * @swagger
 * /tables/transfer:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create transfer
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

/**
 * @swagger
 * /tables/merge-order:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create merge order
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

/**
 * @swagger
 * /tables/{id}/settle-debt:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create id settle debt
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
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tables/{id}/reserve:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create id reserve
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
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tables/{id}/active-order:
 *   get:
 *     tags:
 *       - Table API
 *     summary: Get id active order
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tables/{id}/unpaid-orders:
 *   get:
 *     tags:
 *       - Table API
 *     summary: Get id unpaid orders
 *     description: Auto-generated documentation for existing route
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tables/{id}/update-qr:
 *   put:
 *     tags:
 *       - Table API
 *     summary: Update id update qr
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
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tables/with-qr:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create with qr
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

/**
 * @swagger
 * /tables/{id}/split-bill:
 *   post:
 *     tags:
 *       - Table API
 *     summary: Create id split bill
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
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
