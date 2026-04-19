const express = require('express');
const router = express.Router();

const DeliveryAreaController = require('../controllers/DeliveryAreaController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const {
  provinceSchema,
  createWardSchema,
  updateWardSchema,
  wardIdParamSchema,
  wardQuerySchema,
} = require('../validators/deliveryAreaValidator');

router.get('/provinces', DeliveryAreaController.getProvinces);
router.get('/wards', validate(wardQuerySchema, 'query'), DeliveryAreaController.getWards);

router.post(
  '/provinces',
  authenticate,
  authorize(['manager']),
  validate(provinceSchema),
  DeliveryAreaController.createProvince
);

router.post(
  '/wards',
  authenticate,
  authorize(['manager']),
  validate(createWardSchema),
  DeliveryAreaController.createWard
);

router.put(
  '/wards/:id',
  authenticate,
  authorize(['manager']),
  validate(wardIdParamSchema, 'params'),
  validate(updateWardSchema),
  DeliveryAreaController.updateWard
);

module.exports = router;
