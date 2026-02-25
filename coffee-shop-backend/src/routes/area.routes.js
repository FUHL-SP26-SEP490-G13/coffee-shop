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
  validate(createAreaSchema),
  AreaController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(['manager']),
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
