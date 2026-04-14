const AttendanceRepository = require('../repositories/AttendanceRepository');
const UserRepository = require('../repositories/UserRepository');
const AttendanceSettingRepository = require('../repositories/AttendanceSettingRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const { ATTENDANCE_STATUS } = require('../config/constants');
const formatDateStr = require('../helpers/formatDateStr');
const formatDateTimeStr = require('../helpers/formatDateTimeStr');

class AttendanceService {
  async clock(pinCode) {
    if (!pinCode || pinCode.length !== 4) {
      throw new ErrorResponse(400, 'Mã PIN phải gồm 4 chữ số');
    }

    const user = await UserRepository.findByPinCode(pinCode);
    if (!user || user.isActive === 0) {
      throw new ErrorResponse(404, 'Mã PIN không hợp lệ hoặc tài khoản đã bị khóa');
    }

    // Lấy cấu hình điểm danh (attendance_settings)
    const settings = await AttendanceSettingRepository.findSetting();
    if (!settings) {
      throw new ErrorResponse(500, 'Hệ thống chưa được cấu hình điểm danh');
    }

    // Tìm các ca làm việc đã đăng ký trong hôm nay (status: 'registered')
    const todayShifts = await AttendanceRepository.findTodayShiftsForUser(user.id);

    console.log(todayShifts);

    if (todayShifts.length === 0) {
      throw new ErrorResponse(400, `Xin chào ${user.first_name}, bạn không có ca làm việc nào được duyệt trong hôm nay.`);
    }

    const now = new Date();
    // Tạo mốc thời gian hh:mm dạng phút từ đầu ngày để so sánh dễ dàng
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Tìm ca làm việc 
    let targetShift = null;
    let clockType = null; // 'in' or 'out'

    // Ưu tiên ca đang active (đã check-in nhưng chưa check-out)
    for (const shift of todayShifts) {
      if (shift.check_in && !shift.check_out) {
        targetShift = shift;
        clockType = 'out';
        break;
      }
    }

    // Nếu không có ca nào đang active, tìm ca gần nhất để check-in
    let specificErrorMsg = null;

    if (!targetShift) {
      let closestShiftDiff = null;
      const nowMs = now.getTime();

      for (const shift of todayShifts) {
        if (!shift.check_in) {
          const shiftDateStr = formatDateStr(new Date(shift.shift_date));
          const [startH, startM] = shift.start_time.split(':');
          const startDateObj = new Date(`${shiftDateStr}T${startH}:${startM}:00`);
          const startMs = startDateObj.getTime();

          const minCheckinMs = startMs - (settings.early_checkin_minutes * 60000);
          const maxCheckinMs = startMs + (settings.max_late_minutes * 60000);

          if (nowMs >= minCheckinMs && nowMs <= maxCheckinMs) {
            targetShift = shift;
            clockType = 'in';
            specificErrorMsg = null;
            break;
          } else {
            const diffMs = Math.abs(nowMs - startMs);

            // Bỏ qua các ca quá xa (quá 12 tiếng) tránh báo lỗi khó hiểu (như phàn nàn về ca ngày hôm qua)
            if (diffMs <= 12 * 3600 * 1000) {
              if (closestShiftDiff === null || diffMs < closestShiftDiff) {
                closestShiftDiff = diffMs;
                if (nowMs < minCheckinMs) {
                  specificErrorMsg = `Xin chào ${user.first_name}, ca ${shift.shift_name} (${shiftDateStr}) chưa mở điểm danh. (Chỉ cho phép check-in sớm ${settings.early_checkin_minutes} phút trước ${shift.start_time})`;
                } else if (nowMs > maxCheckinMs) {
                  specificErrorMsg = `Xin chào ${user.first_name}, bạn đã bị chặn điểm danh vì đến quá muộn cho ca ${shift.shift_name} (${shiftDateStr}).`;
                }
              }
            }
          }
        }
      }
    }

    if (!targetShift) {
      const allCompleted = todayShifts.every(s => s.check_in && s.check_out);
      if (allCompleted) {
        throw new ErrorResponse(400, `Xin chào ${user.first_name}, bạn đã hoàn thành (check-in và check-out) cho tất cả ca làm việc hôm nay.`);
      }

      // Ưu tiên báo lỗi chi tiết nếu có
      if (specificErrorMsg) {
        throw new ErrorResponse(400, specificErrorMsg);
      }

      throw new ErrorResponse(400, `Xin chào ${user.first_name}, hiện tại không nằm trong khung giờ điểm danh cho thẻ ca làm của bạn.`);
    }

    // Thực hiện clock in/out
    if (clockType === 'in') {
      return this._handleClockIn(user, targetShift, now, settings);
    } else {
      return this._handleClockOut(user, targetShift, now, settings);
    }
  }

  async _handleClockIn(user, targetShift, timeObj, settings) {
    // Dùng Date object để tính toán lệch giờ chính xác
    const shiftDateStr = formatDateStr(new Date(targetShift.shift_date));
    const [startH, startM] = targetShift.start_time.split(':');
    const startDateObj = new Date(`${shiftDateStr}T${startH}:${startM}:00`);

    const diffMs = timeObj.getTime() - startDateObj.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    let status = ATTENDANCE_STATUS.PRESENT;
    let lateMinutes = 0;

    if (diffMinutes > settings.late_after_minutes) {
      status = ATTENDANCE_STATUS.LATE;
      lateMinutes = diffMinutes;
    }

    const checkInTime = formatDateTimeStr(timeObj);

    const newRecord = await AttendanceRepository.create({
      registration_id: targetShift.registration_id,
      check_in: checkInTime,
      status: status
    });

    return {
      message: `Xin chào ${user.first_name}, CHECK-IN thành công cho ca ${targetShift.shift_name}!`,
      type: 'check_in',
      attendance: newRecord,
      lateMinutes: lateMinutes > 0 ? lateMinutes : 0
    };
  }

  async _handleClockOut(user, targetShift, timeObj, settings) {
    const checkOutTime = formatDateTimeStr(timeObj);

    const updatedRecord = await AttendanceRepository.update(targetShift.attendance_id, {
      check_out: checkOutTime
    });

    return {
      message: `Tạm biệt ${user.first_name}, CHECK-OUT thành công!`,
      type: 'check_out',
      attendance: updatedRecord
    };
  }

  /**
   * Search attendances (Manager)
   */
  async searchAttendances(filters) {
    const list = await AttendanceRepository.searchAttendances(filters);
    return list;
  }

  /**
   * Update attendance manual (Manager adds note only)
   */
  async updateAttendance(id, data) {
    const record = await AttendanceRepository.findById(id);
    if (!record) {
      throw new ErrorResponse(404, 'Không tìm thấy bản ghi điểm danh');
    }

    const updatePayload = {};
    if (data.note !== undefined) updatePayload.note = data.note;

    if (Object.keys(updatePayload).length === 0) {
      throw new ErrorResponse(400, 'Chỉ được phép cập nhật ghi chú (note). Tổ chức không cho phép thay đổi dữ liệu check-in/check-out gốc.');
    }

    await AttendanceRepository.update(id, updatePayload);
    return await AttendanceRepository.getAttendanceDetails(id);
  }

  /**
   * CRON JOB LOGIC
   * Tự động quét vắng mặt & quên check-out
   */
  async executeAutoCronLogic() {
    let result = { missing_checkout: 0, absent: 0 }; // Giữ key missing_checkout cho tương thích API

    // 1. Quét vắng mặt nguyên ngày hôm qua (chưa hề có trong attendances)
    const absents = await AttendanceRepository.findAbsentRegistrations();
    for (const reg of absents) {
      await AttendanceRepository.create({
        registration_id: reg.registration_id,
        status: ATTENDANCE_STATUS.ABSENT,
        note: 'Hệ thống đánh dấu vắng mặt (Không check-in)'
      });
      result.absent++;
    }

    return result;
  }
}

module.exports = new AttendanceService();
