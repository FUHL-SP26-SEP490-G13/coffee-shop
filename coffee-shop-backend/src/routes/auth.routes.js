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
