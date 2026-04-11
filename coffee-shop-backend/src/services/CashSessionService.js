const repository = require("../repositories/CashSessionRepository");

class CashSessionService {
  async getCurrentSession(userId) {
    const session = await repository.getCurrentSession();
    
    // Fetch the user's active shift
    const currentShift = await repository.getCurrentUserShift(userId);
    const shiftEndTime = currentShift ? currentShift.end_time : null;

    if (session) {
      const generatedSystemCash = await repository.getSystemCash(session.opened_at);
      session.closing_cash_system = session.opening_cash + generatedSystemCash;
      session.generated_cash = generatedSystemCash;
    }

    return {
      session,
      shiftEndTime,
    };
  }

  async openSession(userId, openingCash) {
    const current = await repository.getCurrentSession();
    if (current) {
      throw { statusCode: 400, message: "Đã có ca làm việc đang mở. Vui lòng đóng ca trước khi mở mới." };
    }

    const currentShift = await repository.getCurrentUserShift(userId);
    const shift_registration_id = currentShift ? currentShift.shift_registration_id : null;

    if (!shift_registration_id) {
      throw { statusCode: 403, message: "Không tìm thấy ca làm việc hợp lệ trong lịch làm việc của bạn hôm nay." };
    }

    const code = `CS-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000)}`;

    const sessionId = await repository.openSession({
      code,
      opened_by: userId,
      opening_cash: Number(openingCash) || 0,
      shift_registration_id,
    });

    return { id: sessionId, code };
  }

  async closeSession(userId, sessionId, actualCash, note) {
    const session = await repository.getCurrentSession();
    if (!session || session.id !== sessionId) {
      throw { statusCode: 400, message: "Ca làm việc không tồn tại hoặc đã đóng." };
    }

    let shiftEndTimeStr = null;
    if (session.shift_registration_id) {
      shiftEndTimeStr = await repository.getShiftEndTimeById(session.shift_registration_id);
    } else {
      // Fallback cho các session cũ chưa có shift_registration_id
      const currentShift = await repository.getCurrentUserShift(userId);
      shiftEndTimeStr = currentShift ? currentShift.end_time : null;
    }

    if (shiftEndTimeStr) {
      const now = new Date();
      // Parse shiftEndTime (HH:MM:SS) to compare with current time
      const [hours, minutes, seconds] = shiftEndTimeStr.split(':').map(Number);
      const shiftEnd = new Date();
      shiftEnd.setHours(hours, minutes, seconds || 0, 0);

      // If current time is strictly less than shift end time, prevent closing.
      // E.g., if end is 14:00:00, cannot close at 13:59:59.
      if (now < shiftEnd) {
        throw { statusCode: 403, message: "Chưa đến giờ kết thúc ca làm việc, không thể đóng ca." };
      }
    }

    const generatedSystemCash = await repository.getSystemCash(session.opened_at);
    const closingCashSystem = session.opening_cash + generatedSystemCash;
    const actual = Number(actualCash) || 0;
    const difference = actual - closingCashSystem;

    await repository.closeSession({
      id: session.id,
      closed_by: userId,
      closing_cash_actual: actual,
      closing_cash_system: closingCashSystem,
      cash_difference: difference,
      closing_note: note || "",
    });

    return { success: true, difference };
  }
}

module.exports = new CashSessionService();
