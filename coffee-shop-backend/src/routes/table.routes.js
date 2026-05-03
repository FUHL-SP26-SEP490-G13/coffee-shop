const express = require('express');
const router = express.Router();
const TableController = require('../controllers/TableController');
const { createTableSchema, updateTableSchema, tableIdSchema } = require('../validators/tableValidator');
const validate = require('../middlewares/validate');

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
router.post('/transfer-order', TableController.transferOrder);
router.post('/transfer', TableController.transferTable);
router.post('/merge-order', TableController.mergeOrders);
router.post('/:id/settle-debt', TableController.settleTableDebt);
// router.post('/:id/reserve', TableController.reserveTable);
router.get('/:id/active-order', TableController.getActiveOrder);
router.get('/:id/unpaid-orders', TableController.getUnpaidOrders);
router.put('/:id', validateRequest(updateTableSchema), TableController.updateTable);

// API cập nhật QR code cho bàn đã có sẵn
router.put('/:id/update-qr', TableController.updateQrForTable);
router.get('/:id', TableController.getTable);
router.delete('/:id', TableController.deleteTable);

router.post('/with-qr', validate(createTableSchema), TableController.createTableWithQrCode);

// Split bill logic
router.post(
  '/:id/split-bill',
  TableController.splitBill
);

module.exports = router;
