const SwapRequestRepository = require('../repositories/SwapRequestRepository');
const ShiftRepository = require('../repositories/ShiftRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const formatDateStr = require('../helpers/formatDateStr');
class SwapRequestService {
    /**
     * Tạo yêu cầu đổi/nhường ca
     * - receiver_shift_id có → exchange (đổi ca)
     * - receiver_shift_id null → give_away (nhường ca)
     */
    async createSwapRequest({ requester_id, requester_shift_id, receiver_id, receiver_shift_id }) {
        if (!requester_shift_id) throw new ErrorResponse(400, 'Thiếu requester_shift_id');
        if (!receiver_id) throw new ErrorResponse(400, 'Thiếu receiver_id');
        if (requester_id === receiver_id) {
            throw new ErrorResponse(400, 'Không thể đổi ca cho chính mình');
        }
        // Requester phải đang có ca này
        const reqReg = await SwapRequestRepository.findActiveRegistration(requester_id, requester_shift_id);
        if (!reqReg) {
            throw new ErrorResponse(400, 'Bạn không có ca làm này hoặc ca đã bị hủy');
        }
        // Ca phải ở tương lai
        const reqShift = await SwapRequestRepository.findShiftWithTemplate(requester_shift_id);
        if (!reqShift) throw new ErrorResponse(404, 'Shift không tồn tại');
        const shiftDate = typeof reqShift.shift_date === 'string'
            ? reqShift.shift_date.slice(0, 10)
            : formatDateStr(reqShift.shift_date);
        if (shiftDate < formatDateStr(new Date())) {
            throw new ErrorResponse(400, 'Không thể đổi ca đã qua');
        }
        // Receiver phải tồn tại, active, là staff/barista
        const receiver = await ShiftRepository.findUserById(receiver_id);
        if (!receiver) throw new ErrorResponse(404, 'Người nhận không tồn tại');
        if (!receiver.isActive) throw new ErrorResponse(400, 'Người nhận đã ngừng hoạt động');
        if (!['staff', 'barista'].includes(receiver.role_name?.toLowerCase())) {
            throw new ErrorResponse(400, 'Người nhận phải là staff hoặc barista');
        }
        // Nếu exchange: receiver phải đang có receiver_shift
        if (receiver_shift_id) {
            const recReg = await SwapRequestRepository.findActiveRegistration(receiver_id, receiver_shift_id);
            if (!recReg) {
                throw new ErrorResponse(400, 'Người nhận không có ca làm được chọn để đổi');
            }
        }
        // Không trùng pending request
        const dup = await SwapRequestRepository.findPendingDuplicate(
            requester_id, requester_shift_id, receiver_id,
        );
        if (dup) {
            throw new ErrorResponse(400, 'Bạn đã gửi yêu cầu đổi ca này cho người này rồi');
        }
        const swap = await SwapRequestRepository.create({
            requester_id,
            requester_shift_id,
            receiver_id,
            receiver_shift_id: receiver_shift_id || null,
        });
        return this._format(swap);
    }
    /**
     * chấp nhận → thực hiện swap
     */
    async acceptSwapRequest(swapId, receiverId) {
        const swap = await this._getPendingSwap(swapId);
        if (swap.receiver_id !== receiverId) {
            throw new ErrorResponse(403, 'Bạn không phải người nhận yêu cầu này');
        }
        const isExchange = !!swap.receiver_shift_id;
        // Re-validate registrations
        const reqReg = await SwapRequestRepository.findActiveRegistration(
            swap.requester_id, swap.requester_shift_id,
        );
        if (!reqReg) throw new ErrorResponse(400, 'Ca của người gửi đã bị hủy hoặc thay đổi');
        if (isExchange) {
            const recReg = await SwapRequestRepository.findActiveRegistration(
                swap.receiver_id, swap.receiver_shift_id,
            );
            if (!recReg) throw new ErrorResponse(400, 'Ca của bạn đã bị hủy hoặc thay đổi');
            // Overlap check: A nhận ca B (trừ ca A đang nhường)
            await this._checkOverlapExcluding(
                swap.requester_id, swap.receiver_shift_id, swap.requester_shift_id,
            );
            // Overlap check: B nhận ca A (trừ ca B đang nhường)
            await this._checkOverlapExcluding(
                swap.receiver_id, swap.requester_shift_id, swap.receiver_shift_id,
            );
            // Execute: A ↔ B
            await SwapRequestRepository.updateRegistrationStatus(reqReg.id, 'swapped_out');
            await SwapRequestRepository.updateRegistrationStatus(recReg.id, 'swapped_out');
            await SwapRequestRepository.createSwappedRegistration(swap.requester_id, swap.receiver_shift_id);
            await SwapRequestRepository.createSwappedRegistration(swap.receiver_id, swap.requester_shift_id);
        } else {
            // Overlap check: B nhận ca A
            await this._checkOverlap(swap.receiver_id, swap.requester_shift_id);
            // Execute: A out, B in
            await SwapRequestRepository.updateRegistrationStatus(reqReg.id, 'swapped_out');
            await SwapRequestRepository.createSwappedRegistration(swap.receiver_id, swap.requester_shift_id);
        }
        const updated = await SwapRequestRepository.updateStatus(swapId, 'accepted');
        return this._format(updated);
    }
    /**
     * từ chối
     */
    async rejectSwapRequest(swapId, receiverId) {
        const swap = await this._getPendingSwap(swapId);
        if (swap.receiver_id !== receiverId) {
            throw new ErrorResponse(403, 'Bạn không phải người nhận yêu cầu này');
        }
        const updated = await SwapRequestRepository.updateStatus(swapId, 'rejected');
        return this._format(updated);
    }
    /**
     * Hủy yêu cầu (khi còn pending)
     */
    async cancelSwapRequest(swapId, requesterId) {
        const swap = await this._getPendingSwap(swapId);
        if (swap.requester_id !== requesterId) {
            throw new ErrorResponse(403, 'Bạn không phải người gửi yêu cầu này');
        }
        const updated = await SwapRequestRepository.updateStatus(swapId, 'cancelled');
        return this._format(updated);
    }
    /**
     * Danh sách swap requests của user (gửi + nhận)
     */
    async getMySwapRequests(userId) {
        const rows = await SwapRequestRepository.findByUserId(userId);
        return rows.map((r) => this._format(r));
    }
    /**
     * Chi tiết 1 swap request
     */
    async getSwapRequestById(swapId, userId) {
        const swap = await SwapRequestRepository.findById(swapId);
        if (!swap) throw new ErrorResponse(404, 'Yêu cầu đổi ca không tồn tại');
        if (swap.requester_id !== userId && swap.receiver_id !== userId) {
            throw new ErrorResponse(403, 'Bạn không có quyền xem yêu cầu này');
        }
        return this._format(swap);
    }
    // =============================================
    // PRIVATE HELPERS
    // =============================================
    async _getPendingSwap(swapId) {
        const swap = await SwapRequestRepository.findById(swapId);
        if (!swap) throw new ErrorResponse(404, 'Yêu cầu đổi ca không tồn tại');
        if (swap.status !== 'pending') {
            throw new ErrorResponse(400, `Yêu cầu đã được xử lý`);
        }
        return swap;
    }
    /** Check overlap cho give_away (B nhận ca mới) */
    async _checkOverlap(userId, newShiftId) {
        const newShift = await SwapRequestRepository.findShiftWithTemplate(newShiftId);
        if (!newShift) throw new ErrorResponse(404, 'Shift không tồn tại');
        const dateStr = typeof newShift.shift_date === 'string'
            ? newShift.shift_date.slice(0, 10)
            : formatDateStr(newShift.shift_date);
        const existing = await SwapRequestRepository.findUserShiftsOnDate(userId, dateStr);
        this._detectOverlap(existing, newShift, dateStr);
    }
    /** Check overlap cho exchange (loại bỏ ca sẽ bị swapped_out) */
    async _checkOverlapExcluding(userId, newShiftId, excludeShiftId) {
        const newShift = await SwapRequestRepository.findShiftWithTemplate(newShiftId);
        if (!newShift) throw new ErrorResponse(404, 'Shift không tồn tại');
        const dateStr = typeof newShift.shift_date === 'string'
            ? newShift.shift_date.slice(0, 10)
            : formatDateStr(newShift.shift_date);
        const existing = await SwapRequestRepository.findUserShiftsOnDate(userId, dateStr);
        const filtered = existing.filter((s) => s.shift_id !== excludeShiftId);
        this._detectOverlap(filtered, newShift, dateStr);
    }
    _detectOverlap(existingShifts, newShift, dateStr) {
        const toMins = (hhmm) => {
            const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
            return h * 60 + m;
        };
        const newStart = toMins(newShift.start_time);
        const newEnd = toMins(newShift.end_time);
        for (const s of existingShifts) {
            const sStart = toMins(s.start_time);
            const sEnd = toMins(s.end_time);
            if (newStart < sEnd && newEnd > sStart) {
                throw new ErrorResponse(
                    400,
                    `Trùng giờ với ${s.template_name} (${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}) ngày ${dateStr}`,
                );
            }
        }
    }
    _format(row) {
        const isExchange = !!row.receiver_shift_id;
        const fmtDate = (d) =>
            d == null ? null : typeof d === 'string' ? d.slice(0, 10) : formatDateStr(d);
        return {
            id: row.id,
            type: isExchange ? 'exchange' : 'give_away',
            status: row.status,
            requester: {
                id: row.requester_id,
                name: `${row.requester_first_name} ${row.requester_last_name}`,
            },
            receiver: {
                id: row.receiver_id,
                name: `${row.receiver_first_name} ${row.receiver_last_name}`,
            },
            requester_shift: {
                shift_id: row.requester_shift_id,
                date: fmtDate(row.requester_shift_date),
                template_id: row.requester_template_id,
                template_name: row.requester_template_name,
                start_time: row.requester_start_time,
                end_time: row.requester_end_time,
                color: row.requester_color,
            },
            receiver_shift: isExchange
                ? {
                    shift_id: row.receiver_shift_id,
                    date: fmtDate(row.receiver_shift_date),
                    template_id: row.receiver_template_id,
                    template_name: row.receiver_template_name,
                    start_time: row.receiver_start_time,
                    end_time: row.receiver_end_time,
                    color: row.receiver_color,
                }
                : null,
            responded_at: row.responded_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
module.exports = new SwapRequestService();
