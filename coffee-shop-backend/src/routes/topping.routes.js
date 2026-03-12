const express = require('express');
const publicRouter = express.Router();
const adminRouter = express.Router();
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
publicRouter.get(
  '/',
  ToppingController.getAll
);

// Search toppings
publicRouter.get(
  '/search',
  validate(searchToppingSchema, 'query'),
  ToppingController.search
);

// Get topping by ID
publicRouter.get(
  '/:id',
  validate(toppingIdSchema, 'params'),
  ToppingController.getById
);

/**
 * Admin only routes
 */

// Create new topping
adminRouter.post(
  '/',
  authenticate,
  // authorize(['admin']),
  validate(createToppingSchema),
  ToppingController.create
);

// Update topping
adminRouter.put(
  '/:id',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  validate(updateToppingSchema),
  ToppingController.update
);

// Delete topping
adminRouter.delete(
  '/:id',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.delete
);

// Restore deleted topping
adminRouter.post(
  '/:id/restore',
  authenticate,
  // authorize(['admin']),
  validate(toppingIdSchema, 'params'),
  ToppingController.restore
);

module.exports = {
  publicToppingRoutes: publicRouter,
  adminToppingRoutes: adminRouter,
};
