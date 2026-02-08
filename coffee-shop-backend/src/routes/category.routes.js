const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  searchCategorySchema,
} = require('../validators/categoryValidator');

/**
 * Public routes
 */

// Get all categories
router.get(
  '/',
  CategoryController.getAll
);

// Search categories
router.get(
  '/search',
  validate(searchCategorySchema, 'query'),
  CategoryController.search
);

// Get category by ID
router.get(
  '/:id',
  validate(categoryIdSchema, 'params'),
  CategoryController.getById
);

/**
 * Protected routes - Admin only
 */

// Create new category
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(createCategorySchema),
  CategoryController.create
);

// Update category
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate(categoryIdSchema, 'params'),
  validate(updateCategorySchema),
  CategoryController.update
);

// Delete category
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate(categoryIdSchema, 'params'),
  CategoryController.delete
);

// Restore deleted category
router.post(
  '/:id/restore',
  authenticate,
  authorize(['admin']),
  validate(categoryIdSchema, 'params'),
  CategoryController.restore
);

module.exports = router;
