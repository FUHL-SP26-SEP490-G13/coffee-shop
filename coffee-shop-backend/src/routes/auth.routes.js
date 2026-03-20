const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordWithOtpSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} = require("../validators/authValidator");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and user management endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               username:
 *                 type: string
 *                 example: username
 *               fullName:
 *                 type: string
 *                 example: Full Name
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email or username already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User login
 *     description: Authenticate user and get JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation failed
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send OTP to email
 *     description: Send One-Time Password to user's email for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: Email not found
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email with OTP
 *     description: Verify user email using the OTP sent to their email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid OTP
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user profile
 *     description: Retrieve the current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags:
 *       - Auth
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Change user password
 *     description: Change the current user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         description: Current password is incorrect
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User logout
 *     description: Logout the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/address:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get user addresses
 *     description: Retrieve all addresses for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags:
 *       - Auth
 *     summary: Create new address
 *     description: Add a new address for the current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /auth/address/{id}:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Update address
 *     description: Update a specific user address
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
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Delete address
 *     description: Delete a specific user address
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
 *         description: Address deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * Public routes (no authentication required)
 */

// Register
router.post("/register", validate(registerSchema), AuthController.register);

// Send email OTP
router.post("/send-otp", AuthController.sendOTP);

// Verify email OTP
router.post("/verify-email", AuthController.verifyEmail);

// Login
router.post("/login", validate(loginSchema), AuthController.login);

// Google login
router.post("/google", AuthController.googleLogin);

// Refresh token
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken,
);

// Reset password request
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

// Verify OTP for password reset
router.post(
  "/forgot-password/verify-otp",
  validate(verifyForgotPasswordOtpSchema),
  AuthController.verifyForgotPasswordOtp,
);

// Reset password with OTP
router.post(
  "/forgot-password/reset",
  validate(resetPasswordWithOtpSchema),
  AuthController.resetPasswordWithOtp,
);

/**
 * Protected routes (authentication required)
 */

// Get current user profile
router.get("/profile", authenticate, AuthController.getProfile);

// Update profile
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  AuthController.updateProfile,
);

// Change password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword,
);

// Logout
router.post("/logout", authenticate, AuthController.logout);

// Get my addresses
router.get('/address', authenticate, AuthController.getMyAddresses);

// Create new address
router.post(
  '/address',
  authenticate,
  validate(createAddressSchema),
  AuthController.createAddress,
);

// Update address
router.put(
  '/address/:id',
  authenticate,
  validate(addressIdParamSchema, 'params'),
  validate(updateAddressSchema),
  AuthController.updateAddress,
);

// Delete address (soft delete)
router.delete(
  '/address/:id',
  authenticate,
  validate(addressIdParamSchema, 'params'),
  AuthController.deleteAddress,
);

// Set default address
router.patch(
  '/address/:id/default',
  authenticate,
  validate(addressIdParamSchema, 'params'),
  AuthController.setDefaultAddress,
);

module.exports = router;
