const AttendanceService = require('../services/AttendanceService');
const response = require('../utils/response');
const { calculateOffset } = require('../utils/helpers');

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
   * GET /api/attendance
   * Lấy danh sách điểm danh với filter (Admin)
   */
  async getAll(req, res) {
    const { page = 1, limit = 20, startDate, endDate, userId, status } = req.query;
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
