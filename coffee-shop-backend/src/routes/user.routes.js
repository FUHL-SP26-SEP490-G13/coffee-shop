const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { registerSchema } = require('../validators/authValidator');

/**
 * Protected routes - Admin only
 */

// Get user statistics
router.get(
  '/stats',
  authenticate,
  authorize(['admin']),
  UserController.getStatistics
);

// Get all staff
router.get(
  '/staff',
  authenticate,
  authorize(['admin']),
  UserController.getStaff
);

// Get all customers
router.get(
  '/customers',
  authenticate,
  authorize(['admin']),
  UserController.getCustomers
);

// Search users
router.get(
  '/search',
  authenticate,
  authorize(['admin']),
  UserController.search
);

// Get users by role
router.get(
  '/role/:roleId',
  authenticate,
  authorize(['admin']),
  UserController.getByRole
);

// Get all users
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  UserController.getAll
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  authorize(['admin']),
  UserController.getById
);

// Create new user
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(registerSchema),
  UserController.create
);

// Update user
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  UserController.update
);

// Deactivate user
router.post(
  '/:id/deactivate',
  authenticate,
  authorize(['admin']),
  UserController.deactivate
);

// Activate user
router.post(
  '/:id/activate',
  authenticate,
  authorize(['admin']),
  UserController.activate
);

// Delete user permanently
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  UserController.delete
);

module.exports = router;
