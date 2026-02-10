const UserRepository = require('../repositories/UserRepository');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/helpers');
const { ROLES } = require('../config/constants');

class AuthService {
  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (!password) {
      throw new Error('Mật khẩu không được để trống');
    }

    if (password.length < 8 || password.length > 20) {
      throw new Error('Mật khẩu phải từ 8-20 ký tự');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Mật khẩu phải chứa chữ thường (a-z)');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Mật khẩu phải chứa chữ hoa (A-Z)');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Mật khẩu phải chứa số (0-9)');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Mật khẩu phải chứa ký tự đặc biệt (!@#$...)');
    }
  }

  /**
   * Validate phone number (Vietnam format)
   */
  validatePhone(phone) {
    if (!phone) {
      throw new Error('Số điện thoại không được để trống');
    }

    const cleaned = phone.replace(/\s/g, '');

    // Check length (max 12 characters)
    if (cleaned.length > 12) {
      throw new Error('Số điện thoại tối đa 12 ký tự');
    }

    // Check format: starts with 0 or +84, followed by 9-11 digits
    if (!/^(\+84|0)[0-9]{9,11}$/.test(cleaned)) {
      throw new Error('Số điện thoại không hợp lệ (0xxx hoặc +84xxx)');
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    if (!email) {
      throw new Error('Email không được để trống');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email không hợp lệ');
    }
  }

  /**
   * Register new user
   */
  async register(data) {
    // Validate inputs
    if (!data.first_name) {
      throw new Error('Họ không được để trống');
    }

    if (!data.last_name) {
      throw new Error('Tên không được để trống');
    }

    this.validateEmail(data.email);
    this.validatePhone(data.phone);
    this.validatePassword(data.password);

    // Check if email exists
    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email đã được sử dụng');
    }

    // Check if phone exists
    const existingPhone = await UserRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error('Số điện thoại đã được sử dụng');
    }

    // Check if username exists
    const existingUsername = await UserRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user (default role: customer)
    const user = await UserRepository.create({
      phone: data.phone,
      username: data.username,
      password: hashedPassword,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender ?? null,
      dob: data.dob,
      role_id: data.role_id || ROLES.CUSTOMER,
      isActive: 1,
    });

    // Remove password from response
    delete user.password;

    // Generate tokens
    const token = generateToken({ id: user.id, role_id: user.role_id });
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
      user,
      token,
      refreshToken,
    };
  }

  /**
   * Login with email/username and password
   */
  async login(identifier, password) {
    // Find user by email or username
    let user = await UserRepository.findByEmail(identifier);

    if (!user) {
      user = await UserRepository.findByUsername(identifier);
    }

    if (!user) {
      throw new Error('Email/Username hoặc mật khẩu không đúng');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email/Username hoặc mật khẩu không đúng');
    }

    // Get user with role
    const userWithRole = await UserRepository.findByIdWithRole(user.id);

    // Remove password from response
    delete userWithRole.password;

    // Generate tokens
    const token = generateToken({ 
      id: userWithRole.id, 
      role_id: userWithRole.role_id 
    });
    const refreshToken = generateRefreshToken({ id: userWithRole.id });

    return {
      user: userWithRole,
      token,
      refreshToken,
    };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new Error('Refresh token không hợp lệ');
    }

    // Get user
    const user = await UserRepository.findById(decoded.id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    if (!user.isActive) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    // Generate new tokens
    const newToken = generateToken({ 
      id: user.id, 
      role_id: user.role_id 
    });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await UserRepository.findByIdWithRole(userId);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // Remove password from response
    delete user.password;

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    // Get user
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await UserRepository.updatePassword(userId, hashedPassword);

    return true;
  }

  /**
   * Update profile
   */
  async updateProfile(userId, data) {
    // Check if user exists
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // If updating phone, check if it's already used by another user
    if (data.phone && data.phone !== user.phone) {
      const phoneExists = await UserRepository.phoneExists(data.phone, userId);
      if (phoneExists) {
        throw new Error('Số điện thoại đã được sử dụng');
      }
    }

    // Update profile
    const updatedUser = await UserRepository.updateProfile(userId, data);

    // Remove password from response
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Reset password (would need email service in production)
   */
  async resetPassword(email) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'Nếu email tồn tại, link reset password đã được gửi' };
    }

    // TODO: Generate reset token and send email
    // For now, just return success message

    return { 
      message: 'Link reset password đã được gửi đến email của bạn',
      // In development, you might want to return the reset token
      // resetToken: generateRandomString(32)
    };
  }
}

module.exports = new AuthService();
