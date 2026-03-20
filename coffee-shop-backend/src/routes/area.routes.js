const express = require('express');
const router = express.Router();
const AreaController = require('../controllers/AreaController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createAreaSchema,
  updateAreaSchema,
  areaIdSchema,
} = require('../validators/areaValidator');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   - name: Areas
 *     description: Dining area management endpoints
 */

/**
 * @swagger
 * /area:
 *   get:
 *     tags:
 *       - Areas
 *     summary: Get all areas
 *     description: Retrieve list of all dining areas
 *     responses:
 *       200:
 *         description: Areas retrieved successfully
 *   post:
 *     tags:
 *       - Areas
 *     summary: Create area
 *     description: Create a new dining area (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Area created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /area/{id}:
 *   get:
 *     tags:
 *       - Areas
 *     summary: Get area by ID
 *     description: Retrieve detailed information of a specific area
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Area found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Areas
 *     summary: Update area
 *     description: Update area information (admin only)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Area updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Areas
 *     summary: Delete area
 *     description: Delete a dining area (admin only)
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
 *         description: Area deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * Public routes
 */
router.get('/', AreaController.getAll);
router.get('/:id', validate(areaIdSchema, 'params'), AreaController.getById);

/**
 * Protected routes - Manager only
 */
router.post(
  '/',
  authenticate,
  authorize(['manager']),
  upload.single('image'),
  validate(createAreaSchema),
  AreaController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(['manager']),
  upload.single('image'),
  validate(areaIdSchema, 'params'),
  validate(updateAreaSchema),
  AreaController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(['manager']),
  validate(areaIdSchema, 'params'),
  AreaController.delete
);


module.exports = router;
