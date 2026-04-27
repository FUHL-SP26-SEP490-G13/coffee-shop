const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const parseJsonFields = require('../middlewares/parseJsonFields');
const { ROLES_STRING } = require('../config/constants');

const MANAGER_ONLY = [ROLES_STRING.MANAGER];

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
router.get('/', ProductController.getAll);

// Search products (phải đặt trước /:id để tránh conflict)
router.get('/search', validate(searchProductSchema, 'query'), ProductController.search);

// Get products by category
router.get('/category/:categoryId', ProductController.getByCategory);

router.get("/best-sellers", ProductController.getBestSellers);

// Get product by ID
router.get('/:id', validate(productIdSchema, 'params'), ProductController.getById);


// Create new product
router.post(
  '/',
  authenticate,
  authorize(MANAGER_ONLY),
  upload.array('images', 5), // Max 5 images
  validate(createProductSchema),
  ProductController.create
);

// Update product
router.put(
  '/:id',
  authenticate,
  authorize(MANAGER_ONLY),
  validate(productIdSchema, 'params'),
  upload.array('images', 5), // Max 5 images
  parseJsonFields(['sizes', 'deleteSizeIds', 'deleteImageIds']),
  validate(updateProductSchema),
  ProductController.update
);

// Delete product
router.delete(
  '/:id',
  authenticate,
  authorize(MANAGER_ONLY),
  validate(productIdSchema, 'params'),
  ProductController.delete
);

module.exports = router;