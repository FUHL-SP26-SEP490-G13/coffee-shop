const AttendanceService = require('../services/AttendanceService');
const response = require('../utils/response');
const ErrorResponse = require('../utils/ErrorResponse');
const { calculateOffset } = require('../utils/helpers');

const AttendanceSettingRepository = require('../repositories/AttendanceSettingRepository');

class AttendanceController {
  /**
   * POST /api/attendance/clock
   * Nhận mã PIN và xử lý clock in hoặc clock out tự động
   */
  async clock(req, res) {
    const { pin_code } = req.body;
    const result = await AttendanceService.clock(pin_code);

    return response.success(
      res,
      {
        type: result.type,
        attendance: result.attendance,
        lateMinutes: result.lateMinutes
      },
      result.message
    );
  }

  /**
   * POST /api/attendance/verify-kiosk
   * Xác thực mã Kiosk
   */
  async verifyKiosk(req, res) {
    const { kioskKey } = req.body;
    const { KIOSK_SECRET_KEY } = require('../config/env');
    
    const settings = await AttendanceSettingRepository.findSetting();
    const validKey = settings?.kiosk_secret_key || KIOSK_SECRET_KEY;
    
    if (!kioskKey || kioskKey !== validKey) {
      throw new ErrorResponse(403, 'Mã bảo mật Kiosk không chính xác. Vui lòng thử lại.');
    }

    return response.success(res, null, 'Xác thực Kiosk thành công');
  }

  /**
   * POST /api/attendance/clock-face
   * Điểm danh bằng hình ảnh khuôn mặt
   */
  async clockByFace(req, res) {
    const kioskKey = req.headers['x-kiosk-key'];
    const { KIOSK_SECRET_KEY } = require('../config/env');
    
    const settings = await AttendanceSettingRepository.findSetting();
    const validKey = settings?.kiosk_secret_key || KIOSK_SECRET_KEY;
    
    // Kiểm tra xem request có xuất phát từ thiết bị Kiosk hợp lệ không
    if (!kioskKey || kioskKey !== validKey) {
      throw new ErrorResponse(403, 'Thiết bị này không được ủy quyền để điểm danh. Vui lòng cấu hình lại Kiosk.');
    }

    if (!req.file) {
      throw new ErrorResponse(400, 'Không tìm thấy file ảnh');
    }

    const imageBuffer = req.file.buffer;
    const result = await AttendanceService.clockByFace(imageBuffer);

    return response.success(
      res,
      {
        type: result.type,
        attendance: result.attendance,
        lateMinutes: result.lateMinutes
      },
      result.message
    );
  }

  /**
   * POST /api/attendance/register-face/:userId
   * Đăng ký khuôn mặt cho nhân viên
   */
  async registerFace(req, res) {
    const { userId } = req.params;
    if (!req.file) {
      throw new ErrorResponse(400, 'Không tìm thấy file ảnh');
    }

    const imageBuffer = req.file.buffer;
    const result = await AttendanceService.registerFace(userId, imageBuffer);

    return response.success(
      res,
      result,
      result.message
    );
  }

  /**
   * GET /api/attendance
   * Lấy danh sách điểm danh với filter (Admin)
   */
  async getAll(req, res) {
    const { page = 1, limit = 10, startDate, endDate, userId, status } = req.query;
    const offset = calculateOffset(page, limit);

    const result = await AttendanceService.searchAttendances({
      startDate,
      endDate,
      userId,
      status,
      limit: parseInt(limit),
      offset
    });

    return response.success(
      res,
      {
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      },
      'Lấy danh sách điểm danh thành công'
    );
  }

  /**
   * GET /api/attendance/me
   * Lấy danh sách điểm danh của bản thân (Staff/Barista/Manager)
   */
  async getMyAttendance(req, res) {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const offset = calculateOffset(page, limit);

    const result = await AttendanceService.searchAttendances({
      startDate,
      endDate,
      userId: req.user.id,
      status,
      limit: parseInt(limit),
      offset
    });

    return response.success(
      res,
      {
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      },
      'Lấy danh sách điểm danh cá nhân thành công'
    );
  }

  /**
   * PUT /api/attendance/:id
   * Admin chỉnh sửa thẻ điểm danh thủ công
   */
  async update(req, res) {
    const { id } = req.params;
    const updated = await AttendanceService.updateAttendance(id, req.body);

    return response.success(
      res,
      updated,
      'Cập nhật điểm danh thành công'
    );
  }
}

module.exports = new AttendanceController();
