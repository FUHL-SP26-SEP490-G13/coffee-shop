const express = require('express');
const router = express.Router();
const TableController = require('../controllers/TableController');
const { createTableSchema, updateTableSchema, tableIdSchema } = require('../validators/tableValidator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { isManager, isStaff, authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

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
router.post('/transfer-order', authenticate, isStaff, TableController.transferOrder);
router.post('/transfer', authenticate, isStaff, TableController.transferTable);
router.post('/merge-order', authenticate, isStaff, TableController.mergeOrders);
router.post('/:id/settle-debt', authenticate, isStaff, TableController.settleTableDebt);
// router.post('/:id/reserve', TableController.reserveTable);
router.get('/:id/active-order', authenticate, isStaff, TableController.getActiveOrder);
router.get('/:id/unpaid-orders', authenticate, isStaff, TableController.getUnpaidOrders);
router.put('/:id', authenticate, authorize([ROLES_STRING.STAFF, ROLES_STRING.MANAGER]), validateRequest(updateTableSchema), TableController.updateTable);

// API cập nhật QR code cho bàn đã có sẵn
router.put('/:id/update-qr', authenticate, isManager, TableController.updateQrForTable);
router.get('/:id', TableController.getTable);
router.delete('/:id', authenticate, isManager, TableController.deleteTable);

router.post('/with-qr', authenticate, isManager, validate(createTableSchema), TableController.createTableWithQrCode);


// Split bill logic
router.post('/:id/split-bill', authenticate, isStaff, TableController.splitBill);

// Table Group (Gộp bàn) routes
router.post('/merge-group', authenticate, isStaff, TableController.mergeTableGroup);
router.get('/:id/merge-group', authenticate, isStaff, TableController.getTableGroup);
router.delete('/:id/unmerge', authenticate, isStaff, TableController.unmergeTable);
router.delete('/:id/unmerge-all', authenticate, isStaff, TableController.unmergeAllTables);

module.exports = router;
