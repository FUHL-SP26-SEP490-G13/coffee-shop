const express = require('express');
const router = express.Router();
const TableController = require('../controllers/TableController');
const { createTableSchema, updateTableSchema, tableIdSchema } = require('../validators/tableValidator');

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
// router.post('/:id/reserve', TableController.reserveTable);
router.put('/:id', validateRequest(updateTableSchema), TableController.updateTable);
router.delete('/:id', TableController.deleteTable);

module.exports = router;
