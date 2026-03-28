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
} = require('../validators/categoryValidator');

// Get all categories
router.get('/', CategoryController.getAll);


// Create new category
router.post(
  '/',
  // authenticate,
  // authorize(['manager']),
  upload.single('image'),
  validate(createCategorySchema),
  CategoryController.create,
);

// Update category
router.put(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  upload.single('image'),
  validate(updateCategorySchema),
  CategoryController.update,
);

// Delete category
router.delete(
  '/:id',
  // authenticate,
  // authorize(['manager']),
  validate(categoryIdSchema, 'params'),
  CategoryController.delete,
);

module.exports = router;
