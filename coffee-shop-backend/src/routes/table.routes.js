const express = require('express');
const router = express.Router();
const TableController = require('../controllers/TableController');
const { createTableSchema, updateTableSchema, tableIdSchema } = require('../validators/tableValidator');

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
router.put('/:id', validateRequest(updateTableSchema), TableController.updateTable);
router.delete('/:id', TableController.deleteTable);

module.exports = router;
