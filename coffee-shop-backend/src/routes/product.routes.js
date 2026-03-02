const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const parseJsonFields = require('../middlewares/parseJsonFields');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  searchProductSchema,
} = require('../validators/productValidator');

/**
 * Public routes
 */

// Get all products
router.get(
  '/',
  ProductController.getAll
);

// Get product by ID
router.get(
  '/:id',
  validate(productIdSchema, 'params'),
  ProductController.getById
);

// Get products by category
router.get(
  '/category/:categoryId',
  ProductController.getByCategory
);

/**
 * Protected routes - Admin only
 */

// Create new product
router.post(
  '/',
  // authenticate,
  // authorize(['admin']),
  upload.array('images', 5), // Max 5 images
  validate(createProductSchema),
  ProductController.create
);

// Update product
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(productIdSchema, 'params'),
  upload.array('images', 5),
    parseJsonFields(['sizes']),
   validate(updateProductSchema),
  ProductController.update
);

// Delete product
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  validate(productIdSchema, 'params'),
  ProductController.delete
);

// Restore deleted product
// router.post(
//   '/:id/restore',
//   // authenticate,
//   // authorize(['admin']),
//   validate(productIdSchema, 'params'),
//   ProductController.restore
// );

module.exports = router;