const express = require('express');
const router = express.Router();
const ToppingController = require('../controllers/ToppingController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createToppingSchema,
  updateToppingSchema,
  toppingIdSchema,
  searchToppingSchema,
} = require('../validators/toppingValidator');

/**
 * Public routes
 */

// Get all toppings
router.get(
  '/',
  ToppingController.getAll
);

// Search toppings
router.get(
  '/search',
  validate(searchToppingSchema, 'query'),
  ToppingController.search
);

// Get topping by ID
router.get(
  '/:id',
  validate(toppingIdSchema, 'params'),
  ToppingController.getById
);

/**
 * Protected routes - Admin only
 */

// Create new topping
router.post(
  '/',
  // authenticate,
  // authorize(['admin']),
  validate(createToppingSchema),
  ToppingController.create
);

// Update topping
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  validate(updateToppingSchema),
  ToppingController.update
);

// Delete topping
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.delete
);

// Restore deleted topping
router.post(
  '/:id/restore',
  // authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.restore
);

module.exports = router;
