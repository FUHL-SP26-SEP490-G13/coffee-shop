const UserService = require('../services/UserService');
const response = require('../utils/response');
const { calculateOffset } = require('../utils/helpers');

class UserController {
  /**
   * Get all users
   * GET /api/users
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = calculateOffset(page, limit);

      const users = await UserService.getAllUsers({
        limit: parseInt(limit),
        offset,
      });

      return response.success(
        res,
        users,
        'Lấy danh sách users thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { with_addresses } = req.query;

      let user;

      if (with_addresses === 'true') {
        user = await UserService.getUserWithAddresses(id);
      } else {
        user = await UserService.getUserById(id);
      }

      return response.success(
        res,
        user,
        'Lấy thông tin user thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   * GET /api/users/search
   */
  async search(req, res, next) {
    try {
      const { keyword, role_id, page = 1, limit = 20 } = req.query;
      const offset = calculateOffset(page, limit);

      const users = await UserService.searchUsers(keyword, {
        roleId: role_id ? parseInt(role_id) : null,
        limit: parseInt(limit),
        offset,
      });

      return response.success(
        res,
        users,
        'Tìm kiếm users thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by role
   * GET /api/users/role/:roleId
   */
  async getByRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = calculateOffset(page, limit);

      const users = await UserService.getUsersByRole(parseInt(roleId), {
        limit: parseInt(limit),
        offset,
      });

      return response.success(
        res,
        users,
        'Lấy danh sách users theo role thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all staff (staff + barista)
   * GET /api/users/staff
   */
  async getStaff(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = calculateOffset(page, limit);

      const staff = await UserService.getAllStaff({
        limit: parseInt(limit),
        offset,
      });

      return response.success(
        res,
        staff,
        'Lấy danh sách nhân viên thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all customers
   * GET /api/users/customers
   */
  async getCustomers(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = calculateOffset(page, limit);

      const customers = await UserService.getAllCustomers({
        limit: parseInt(limit),
        offset,
      });

      return response.success(
        res,
        customers,
        'Lấy danh sách khách hàng thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new staff/barista (admin only)
   * POST /api/users/staff
   */
  async createStaff(req, res, next) {
    try {
      const result = await UserService.createStaffUser(req.body);

      const message = result.emailSent
        ? 'Tạo nhân viên thành công'
        : 'Tạo nhân viên thành công nhưng gửi email thất bại';

      return response.success(res, result, message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserService.updateUser(id, req.body);

      return response.success(
        res,
        user,
        'Cập nhật user thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user
   * POST /api/users/:id/deactivate
   */
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const adminId = req.user.id;

      if (!password) {
        return response.error(res, 'Mật khẩu là bắt buộc', 400);
      }

      await UserService.deactivateUser(id, adminId, password);

      return response.success(
        res,
        null,
        'Vô hiệu hóa user thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user
   * POST /api/users/:id/activate
   */
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const adminId = req.user.id;

      if (!password) {
        return response.error(res, 'Mật khẩu là bắt buộc', 400);
      }

      await UserService.activateUser(id, adminId, password);

      return response.success(
        res,
        null,
        'Kích hoạt user thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user permanently (admin only)
   * DELETE /api/users/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);

      return response.success(
        res,
        null,
        'Xóa user thành công'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await UserService.getUserStatistics();

      return response.success(
        res,
        stats,
        'Lấy thống kê users thành công'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
