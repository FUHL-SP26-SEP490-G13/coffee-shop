const repository = require("../repositories/CashSessionRepository");

class CashSessionService {
  async getCurrentSession(userId) {
    const session = await repository.getCurrentSession();
    
    let shiftEndTime = null;
    if (session && session.shift_registration_id) {
       shiftEndTime = await repository.getShiftEndTimeById(session.shift_registration_id);
    } else {
       const currentShift = await repository.getCurrentUserShift(userId);
       shiftEndTime = currentShift ? currentShift.end_time : null;
    }

    if (session) {
      const generatedSystemCash = await repository.getSystemCash(session.id);
      session.closing_cash_system = session.opening_cash + generatedSystemCash;
      session.generated_cash = generatedSystemCash;

      const stats = await repository.getHandoverStats();
      session.handoverStats = stats;
    }

    return {
      session,
      shiftEndTime,
    };
  }

  async openSession(userId, openingCash) {
    const currentShift = await repository.getCurrentActiveUserShift(userId);
    const shift_registration_id = currentShift ? currentShift.shift_registration_id : null;

    if (!shift_registration_id) {
      const activeShift = await repository.getCurrentActiveShift();
      let activeUserStr = activeShift ? `${activeShift.last_name || ''} ${activeShift.first_name || ''}`.trim() : "không có ai (hoặc ngoài giờ)";

      const nextShift = await repository.getNextUserShift(userId);
      let nextShiftStr = "";
      if (nextShift) {
        const dateObj = new Date(nextShift.shift_date);
        const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        const startTimeStr = nextShift.start_time.substring(0, 5);
        nextShiftStr = `Ca tiếp theo của bạn là vào lúc ${startTimeStr} ngày ${dateStr}`;
      } else {
        nextShiftStr = `Bạn không có lịch ca tiếp theo`;
      }

      throw { statusCode: 403, message: `Hiện tại là ca của ${activeUserStr}. ${nextShiftStr}` };
    }

    if (!currentShift.check_in) {
      throw { statusCode: 403, message: "Bạn có lịch làm việc lúc này nhưng CHƯA CHẤM CÔNG. Vui lòng chấm công trước khi mở ca." };
    }

    const current = await repository.getCurrentSession();
    if (current) {
      throw { statusCode: 400, message: "Đã có ca làm việc đang mở. Vui lòng đóng ca trước khi mở mới." };
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
    if (!session || Number(session.id) !== Number(sessionId)) {
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

    const generatedSystemCash = await repository.getSystemCash(session.id);
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
  async getSessionsHistory(filters) {
    return await repository.getSessionsHistory(filters);
  }
}

module.exports = new CashSessionService();
