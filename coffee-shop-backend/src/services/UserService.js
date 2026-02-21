const UserRepository = require('../repositories/UserRepository');
const { hashPassword, generateStrongPassword } = require('../utils/helpers');
const EmailService = require('./EmailService');
const { ROLES } = require('../config/constants');

class UserService {
  /**
   * Get all users
   */
  async getAllUsers(options = {}) {
    return UserRepository.findAll({ }, options);
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await UserRepository.findByIdWithRole(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // Remove password from response
    delete user.password;

    return user;
  }

  /**
   * Get user with addresses
   */
  async getUserWithAddresses(id) {
    const user = await UserRepository.findByIdWithAddresses(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // Remove password from response
    delete user.password;

    return user;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId, options = {}) {
    const users = await UserRepository.findByRole(roleId, options);

    // Remove passwords from all users
    users.forEach((user) => delete user.password);

    return users;
  }

  /**
   * Search users
   */
  async searchUsers(keyword, options = {}) {
    if (!keyword || keyword.trim() === '') {
      return this.getAllUsers(options);
    }

    const users = await UserRepository.search(keyword.trim(), options);

    // Remove passwords from all users
    users.forEach((user) => delete user.password);

    return users;
  }

  /**
   * Create new user (admin only)
   */
  async createUser(data) {
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

    // Create user
    const user = await UserRepository.create({
      phone: data.phone,
      username: data.username,
      password: hashedPassword,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender || null,
      dob: data.dob,
      address: data.address || null,
      role_id: data.role_id || ROLES.CUSTOMER,
      isActive: 1,
    });

    // Remove password from response
    delete user.password;

    return user;
  }

  /**
   * Create new staff or barista (admin only)
   */
  async createStaffUser(data) {
    const roleId = parseInt(data.role_id, 10);
    if (![ROLES.STAFF, ROLES.BARISTA].includes(roleId)) {
      throw new Error('Role không hợp lệ');
    }

    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email đã được sử dụng');
    }

    const existingPhone = await UserRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error('Số điện thoại đã được sử dụng');
    }

    const existingUsername = await UserRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username đã được sử dụng');
    }

    const tempPassword = generateStrongPassword(12);
    const hashedPassword = await hashPassword(tempPassword);

    const user = await UserRepository.create({
      phone: data.phone,
      username: data.username,
      password: hashedPassword,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender ?? null,
      dob: data.dob,
      role_id: roleId,
      isActive: 1,
      isVerified: 1,
    });

    delete user.password;

    const roleLabel = roleId === ROLES.BARISTA ? 'Pha chế' : 'Phục vụ';
    let emailSent = true;
    try {
      await EmailService.sendStaffAccountEmail(
        user.email,
        `${user.first_name} ${user.last_name}`.trim(),
        tempPassword,
        roleLabel
      );
    } catch (error) {
      emailSent = false;
    }

    return { user, emailSent };
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    // Check if user exists
    const user = await UserRepository.findById(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // If updating email, check if it's already used by another user
    if (data.email && data.email !== user.email) {
      const emailExists = await UserRepository.emailExists(data.email, id);
      if (emailExists) {
        throw new Error('Email đã được sử dụng');
      }
    }

    // If updating phone, check if it's already used by another user
    if (data.phone && data.phone !== user.phone) {
      const phoneExists = await UserRepository.phoneExists(data.phone, id);
      if (phoneExists) {
        throw new Error('Số điện thoại đã được sử dụng');
      }
    }

    // If updating username, check if it's already used by another user
    if (data.username && data.username !== user.username) {
      const usernameExists = await UserRepository.usernameExists(data.username, id);
      if (usernameExists) {
        throw new Error('Username đã được sử dụng');
      }
    }

    // If updating password, hash it
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    // Update user
    const updatedUser = await UserRepository.update(id, data);

    // Remove password from response
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id) {
    // Check if user exists
    const user = await UserRepository.findById(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    if (user.isActive === 0) {
      throw new Error('User đã bị vô hiệu hóa');
    }

    // Deactivate
    const deactivated = await UserRepository.deactivate(id);

    if (!deactivated) {
      throw new Error('Vô hiệu hóa user thất bại');
    }

    return true;
  }

  /**
   * Activate user
   */
  async activateUser(id) {
    // Check if user exists
    const user = await UserRepository.findById(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    if (user.isActive === 1) {
      throw new Error('User đang hoạt động');
    }

    // Activate
    const activated = await UserRepository.activate(id);

    if (!activated) {
      throw new Error('Kích hoạt user thất bại');
    }

    return true;
  }

  /**
   * Delete user permanently (admin only)
   */
  async deleteUser(id) {
    // Check if user exists
    const user = await UserRepository.findById(id);

    if (!user) {
      throw new Error('User không tồn tại');
    }

    // Don't allow deleting admin users
    if (user.role_id === ROLES.MANAGER) {
      throw new Error('Không thể xóa tài khoản admin');
    }

    // Hard delete
    const deleted = await UserRepository.hardDelete(id);

    if (!deleted) {
      throw new Error('Xóa user thất bại');
    }

    return true;
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    return UserRepository.getUserStats();
  }

  /**
   * Get all staff members (staff + barista)
   */
  async getAllStaff(options = {}) {
    const staff = await UserRepository.findByRole(ROLES.STAFF, options);
    const baristas = await UserRepository.findByRole(ROLES.BARISTA, options);

    const allStaff = [...staff, ...baristas];

    // Remove passwords
    allStaff.forEach((user) => delete user.password);

    return allStaff;
  }

  /**
   * Get all customers
   */
  async getAllCustomers(options = {}) {
    const customers = await UserRepository.findByRole(ROLES.CUSTOMER, options);

    // Remove passwords
    customers.forEach((user) => delete user.password);

    return customers;
  }
}

module.exports = new UserService();
