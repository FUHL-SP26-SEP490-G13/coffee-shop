const AttendanceRepository = require('../repositories/AttendanceRepository');
const UserRepository = require('../repositories/UserRepository');
const AttendanceSettingRepository = require('../repositories/AttendanceSettingRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const { ATTENDANCE_STATUS } = require('../config/constants');
const formatDateStr = require('../helpers/formatDateStr');
const formatDateTimeStr = require('../helpers/formatDateTimeStr');
const RekognitionService = require('./RekognitionService');

const CHECKOUT_GRACE_MINUTES = 30;




class AttendanceService {
  /**
   * Đăng ký khuôn mặt cho user
   */
  async registerFace(userId, imageBuffer) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new ErrorResponse(404, 'Không tìm thấy người dùng');
    }

    try {
      const faceId = await RekognitionService.registerFace(imageBuffer);
      await UserRepository.updateFaceId(userId, faceId);
      return { message: 'Đăng ký khuôn mặt thành công' };
    } catch (error) {
      throw new ErrorResponse(400, 'Lỗi đăng ký khuôn mặt: ' + error.message);
    }
  }

  /**
   * Điểm danh bằng khuôn mặt
   */
  async clockByFace(imageBuffer) {
    let faceId;
    try {
      faceId = await RekognitionService.recognizeFace(imageBuffer);
    } catch (error) {
      throw new ErrorResponse(400, 'Lỗi nhận diện khuôn mặt: ' + error.message);
    }

    if (!faceId) {
      throw new ErrorResponse(400, 'Không tìm thấy khuôn mặt hợp lệ trong ảnh');
    }

    const user = await UserRepository.findByFaceId(faceId);
    if (!user || user.isActive === 0) {
      throw new ErrorResponse(404, 'Khuôn mặt chưa được đăng ký hoặc tài khoản đã bị khóa');
    }

    return await this._processClockLogic(user);
  }

  async _processClockLogic(user) {

    const settings = await AttendanceSettingRepository.findSetting();
    if (!settings) {
      throw new ErrorResponse(500, 'Hệ thống chưa được cấu hình điểm danh');
    }

    const candidateShifts = await AttendanceRepository.findTodayShiftsForUser(
      user.id,
    );

    if (candidateShifts.length === 0) {
      throw new ErrorResponse(
        400,
        `Xin chào ${user.first_name}, bạn không có ca làm việc nào được duyệt trong thời điểm hiện tại.`,
      );
    }

    const now = new Date();
    const nowMs = now.getTime();

    let targetShift = null;
    let specificErrorMsg = null;
    let closestShiftDiff = null;

    // 1. Lấy tất cả ca đang mở
    const openShifts = candidateShifts.filter(
      (shift) => shift.check_in && !shift.check_out,
    );

    // 2. Tìm các ca còn hạn checkout
    const validOpenShifts = openShifts
      .map((shift) => {
        const shiftStart = this._buildShiftStart(
          shift.shift_date,
          shift.start_time,
        );

        const shiftEnd = this._buildShiftEnd(
          shift.shift_date,
          shift.start_time,
          shift.end_time,
        );

        const latestCheckoutTime = new Date(
          shiftEnd.getTime() + CHECKOUT_GRACE_MINUTES * 60 * 1000,
        );

        const checkInTime = shift.check_in ? new Date(shift.check_in) : null;

        const checkoutWindowStart =
          checkInTime && checkInTime > shiftStart ? checkInTime : shiftStart;

        return {
          ...shift,
          _shiftStart: shiftStart,
          _shiftEnd: shiftEnd,
          _latestCheckoutTime: latestCheckoutTime,
          _checkInTime: checkInTime ? checkInTime.getTime() : 0,
          _checkoutWindowStart: checkoutWindowStart,
        };
      })
      .filter(
        (shift) =>
          now >= shift._checkoutWindowStart && now <= shift._latestCheckoutTime,
      )
      .sort((a, b) => {
        if (a._checkInTime !== b._checkInTime) {
          return b._checkInTime - a._checkInTime;
        }
        return b._shiftEnd.getTime() - a._shiftEnd.getTime();
      });

    // 3. Nếu có ca đang mở và còn hạn checkout -> ưu tiên checkout ca gần nhất
    if (validOpenShifts.length > 0) {
      return this._handleClockOut(user, validOpenShifts[0], now);
    }

    // 4. Nếu các ca mở đều đã quá hạn checkout thì bỏ qua chúng, vẫn cho check-in ca mới
    for (const shift of candidateShifts) {
      if (shift.check_in) continue;

      const shiftStart = this._buildShiftStart(
        shift.shift_date,
        shift.start_time,
      );
      const shiftEnd = this._buildShiftEnd(
        shift.shift_date,
        shift.start_time,
        shift.end_time,
      );
      const shiftStartMs = shiftStart.getTime();
      const shiftEndMs = shiftEnd.getTime();

      const minCheckinMs =
        shiftStartMs - Number(settings.early_checkin_minutes) * 60 * 1000;

      // Cho phép check-in từ lúc mở cửa sớm đến TRƯỚC khi ca kết thúc
      if (nowMs >= minCheckinMs && nowMs < shiftEndMs) {
        targetShift = shift;
        specificErrorMsg = null;
        break;
      }

      const diffMs = Math.abs(nowMs - shiftStartMs);
      if (diffMs <= 12 * 60 * 60 * 1000) {
        if (closestShiftDiff === null || diffMs < closestShiftDiff) {
          closestShiftDiff = diffMs;
          const shiftDateStr = formatDateStr(new Date(shift.shift_date));

          if (nowMs < minCheckinMs) {
            specificErrorMsg =
              `Xin chào ${user.first_name}, ${shift.shift_name} (${shiftDateStr}) chưa mở điểm danh. ` +
              `(Chỉ cho phép check-in sớm ${settings.early_checkin_minutes} phút trước ${shift.start_time})`;
          } else if (nowMs >= shiftEndMs) {
            specificErrorMsg = `Xin chào ${user.first_name}, ca ${shift.shift_name} (${shiftDateStr}) đã kết thúc, không thể check-in.`;
          }
        }
      }
    }

    if (targetShift) {
      return this._handleClockIn(user, targetShift, now, settings);
    }

    if (specificErrorMsg) {
      throw new ErrorResponse(400, specificErrorMsg);
    }

    // console.log(candidateShifts)

    const todayStr = formatDateStr(now);

    const todayShifts = candidateShifts.filter(
      (shift) => formatDateStr(new Date(shift.shift_date)) === todayStr
    );

    const allTodayShiftsCompleted =
      todayShifts.length > 0 &&
      todayShifts.every((shift) => shift.check_in && shift.check_out);

    if (allTodayShiftsCompleted) {
      throw new ErrorResponse(
        400,
        `Xin chào ${user.first_name}, bạn đã hoàn thành check-in/check-out cho các ca làm hôm nay.`,
      );
    }

    throw new ErrorResponse(
      400,
      `Xin chào ${user.first_name}, hiện tại không nằm trong khung giờ điểm danh cho ca làm của bạn.`,
    );
  }

  _buildShiftStart(shiftDate, startTime) {
    const shiftDateStr = formatDateStr(new Date(shiftDate));
    const normalizedStart = String(startTime).slice(0, 5);
    return new Date(`${shiftDateStr}T${normalizedStart}:00`);
  }

  _buildShiftEnd(shiftDate, startTime, endTime) {
    const shiftDateStr = formatDateStr(new Date(shiftDate));
    const normalizedStart = String(startTime).slice(0, 5);
    const normalizedEnd = String(endTime).slice(0, 5);

    let end = new Date(`${shiftDateStr}T${normalizedEnd}:00`);

    if (normalizedEnd <= normalizedStart) {
      end.setDate(end.getDate() + 1);
    }

    return end;
  }

  async _handleClockIn(user, targetShift, timeObj, settings) {
    const shiftStart = this._buildShiftStart(
      targetShift.shift_date,
      targetShift.start_time,
    );

    const diffMs = timeObj.getTime() - shiftStart.getTime();
    // diffMinutes < 0 nghĩa là check-in sớm -> không tính muộn
    const diffMinutes = Math.floor(diffMs / 60000);

    let status = ATTENDANCE_STATUS.PRESENT;
    let lateMinutes = 0;

    if (diffMinutes > Number(settings.late_after_minutes)) {
      status = ATTENDANCE_STATUS.LATE;
      lateMinutes = diffMinutes;
    }

    const checkInTime = formatDateTimeStr(timeObj);

    const newRecord = await AttendanceRepository.create({
      registration_id: targetShift.registration_id,
      check_in: checkInTime,
      status,
    });

    return {
      message: `Xin chào ${user.first_name}, CHECK-IN thành công cho ca ${targetShift.shift_name}!`,
      type: 'check_in',
      attendance: newRecord,
      lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
    };
  }

  async _handleClockOut(user, targetShift, timeObj) {
    if (!targetShift.attendance_id) {
      throw new ErrorResponse(
        400,
        'Không tìm thấy bản ghi attendance để check-out.',
      );
    }

    if (!targetShift.check_in || targetShift.check_out) {
      throw new ErrorResponse(
        400,
        'Bản ghi attendance không hợp lệ để check-out.',
      );
    }

    const checkOutTime = formatDateTimeStr(timeObj);

    const updatedRecord = await AttendanceRepository.update(
      targetShift.attendance_id,
      {
        check_out: checkOutTime,
      },
    );

    return {
      message: `Tạm biệt ${user.first_name}, CHECK-OUT thành công!`,
      type: 'check_out',
      attendance: updatedRecord,
    };
  }

  async searchAttendances(filters) {
    return await AttendanceRepository.searchAttendances(filters);
  }

  async updateAttendance(id, data) {
    const record = await AttendanceRepository.findById(id);
    if (!record) {
      throw new ErrorResponse(404, 'Không tìm thấy bản ghi điểm danh');
    }

    const updatePayload = {};

    if (data.note !== undefined) {
      updatePayload.note = data.note;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new ErrorResponse(
        400,
        'Chỉ được phép cập nhật ghi chú (note). Không cho phép thay đổi dữ liệu check-in/check-out gốc.',
      );
    }

    await AttendanceRepository.update(id, updatePayload);
    return await AttendanceRepository.getAttendanceDetails(id);
  }

  async executeAutoCronLogic() {
    const result = { absent: 0, missing_checkout: 0 };

    const absents = await AttendanceRepository.findAbsentRegistrations();

    for (const reg of absents) {
      await AttendanceRepository.create({
        registration_id: reg.registration_id,
        status: ATTENDANCE_STATUS.ABSENT,
        note: 'Hệ thống đánh dấu vắng mặt do không check-in',
      });
      result.absent++;
    }

    return result;
  }
}

module.exports = new AttendanceService();
