const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { registerSchema, staffCreateSchema } = require('../validators/authValidator');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management endpoints (admin only)
 */

/**
 * @swagger
 * /users/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user statistics
 *     description: Retrieve user statistics (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /users/staff:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all staff
 *     description: Retrieve list of all staff members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags:
 *       - Users
 *     summary: Create staff/barista
 *     description: Create a new staff member or barista account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - fullName
 *               - password
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               password:
 *                 type: string
 *               roleId:
 *                 type: integer
 *                 description: 2 for Staff, 3 for Barista
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /users/customers:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all customers
 *     description: Retrieve list of all customer accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /users/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Search users
 *     description: Search users by email, username, or name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /users/role/{roleId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get users by role
 *     description: Retrieve users by role ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           description: 1=Admin, 2=Staff, 3=Barista, 4=Customer
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve all users with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve detailed information of a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     description: Update user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               roleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /users/{id}/deactivate:
 *   post:
 *     tags:
 *       - Users
 *     summary: Deactivate user
 *     description: Deactivate a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /users/{id}/activate:
 *   post:
 *     tags:
 *       - Users
 *     summary: Activate user
 *     description: Activate a deactivated user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User activated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

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

// Create staff/barista
router.post(
  '/staff',
  authenticate,
  authorize(['manager']),
  validate(staffCreateSchema),
  UserController.createStaff
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
