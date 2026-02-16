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
  authorize(['manager']),
  UserController.getStatistics
);

// Get all staff
router.get(
  '/staff',
  authenticate,
  authorize(['manager']),
  UserController.getStaff
);

// Get all customers
router.get(
  '/customers',
  authenticate,
  authorize(['manager']),
  UserController.getCustomers
);

// Search users
router.get(
  '/search',
  authenticate,
  authorize(['manager']),
  UserController.search
);

// Get users by role
router.get(
  '/role/:roleId',
  authenticate,
  authorize(['manager']),
  UserController.getByRole
);

// Get all users
router.get(
  '/',
  authenticate,
  authorize(['manager']),
  UserController.getAll
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  authorize(['manager']),
  UserController.getById
);

// Create new user
router.post(
  '/',
  authenticate,
  authorize(['manager']),
  validate(registerSchema),
  UserController.create
);

// Update user
router.put(
  '/:id',
  authenticate,
  authorize(['manager']),
  UserController.update
);

// Deactivate user
router.post(
  '/:id/deactivate',
  authenticate,
  authorize(['manager']),
  UserController.deactivate
);

// Activate user
router.post(
  '/:id/activate',
  authenticate,
  authorize(['manager']),
  UserController.activate
);

// Delete user permanently
router.delete(
  '/:id',
  authenticate,
  authorize(['manager']),
  UserController.delete
);

module.exports = router;
