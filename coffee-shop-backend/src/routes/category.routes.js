const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

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
  // authenticate,
  // authorize(['manager']),
  upload.single('image'),
  validate(createCategorySchema),
  CategoryController.create
);

// Update category
router.put(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  upload.single('image'),
  validate(updateCategorySchema),
  CategoryController.update
);

// Delete category
router.delete(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  CategoryController.delete
);

// Restore deleted category
router.post(
  '/:id/restore',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  CategoryController.restore
);



module.exports = router;
