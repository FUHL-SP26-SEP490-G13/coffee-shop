const AuthService = require("../services/AuthService");
const response = require("../utils/response");

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);

      return response.success(res, result, "Đăng ký thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send email OTP
   * POST /api/auth/send-otp
   */
  async sendOTP(req, res, next) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return response.error(res, "Thiếu userId", 400);
      }

      const result = await AuthService.sendEmailOTP(userId);

      return response.success(res, result, "Gửi OTP thành công");
    } catch (error) {
      next(error);
    }
  }

  /**   * Verify email OTP
   * POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        return response.error(res, "Thiếu userId hoặc otp", 400);
      }

      const result = await AuthService.verifyEmailOTP(userId, otp);

      return response.success(
        res,
        result,
        "Xác thực email thành công"
      );

    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);

      return response.success(res, result, "Đăng nhập thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      return response.success(res, result, "Refresh token thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);

      return response.success(res, user, "Lấy thông tin profile thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.body);

      return response.success(res, user, "Cập nhật profile thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);

      return response.success(res, null, "Đổi mật khẩu thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resetPassword(email);

      return response.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout (client-side only - just remove token)
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // In a simple JWT implementation, logout is handled client-side
      // by removing the token. If you implement token blacklisting,
      // you would add the token to a blacklist here.

      return response.success(res, null, "Đăng xuất thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth Login
   * POST /api/auth/google
   */
  async googleLogin(req, res, next) {
    try {
      const { accessToken, idToken } = req.body;

      const result = await AuthService.loginWithGoogle(idToken, accessToken);

      return response.success(res, result, "Đăng nhập Google thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
