const SwapRequestRepository = require('../repositories/SwapRequestRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class SwapRequestService {

    // ================================================
    // TẠO YÊU CẦU ĐỔI CA
    // ================================================
    async createSwapRequest(body, requesterId) {
        const { requester_shift_id, receiver_id, receiver_shift_id } = body;

        // 1. Kiểm tra đầu vào cơ bản
        if (!requester_shift_id) throw new ErrorResponse(400, 'Thiếu ca muốn đổi');
        if (!receiver_id) throw new ErrorResponse(400, 'Thiếu người nhận');

        const userAId = Number(requesterId);
        const userBId = Number(receiver_id);
        const shiftAId = Number(requester_shift_id);
        const shiftBId = receiver_shift_id ? Number(receiver_shift_id) : null;

        // 2. Không tự đổi với chính mình
        if (userAId === userBId) {
            throw new ErrorResponse(400, 'Không thể đổi ca cho chính mình');
        }

        // 3. Không đổi 2 ca giống nhau
        if (shiftBId && shiftAId === shiftBId) {
            throw new ErrorResponse(400, 'Không thể đổi 2 ca giống nhau');
        }

        // 4. Kiểm tra A và B tồn tại, còn hoạt động, cùng role
        const userA = await SwapRequestRepository.findUserById(userAId);
        if (!userA) throw new ErrorResponse(404, 'Người gửi không tồn tại');
        if (!userA.isActive) throw new ErrorResponse(400, 'Tài khoản của bạn đã ngừng hoạt động');

        const userB = await SwapRequestRepository.findUserById(userBId);
        if (!userB) throw new ErrorResponse(404, 'Người nhận không tồn tại');
        if (!userB.isActive) throw new ErrorResponse(400, 'Người nhận đã ngừng hoạt động');

        if (userA.role_id !== userB.role_id) {
            throw new ErrorResponse(400, 'Chỉ có thể đổi ca với người cùng vị trí');
        }

        // 5. A phải có ca shiftA và ca chưa qua; còn ít nhất 2 ngày trước ca
        const regA = await SwapRequestRepository.findActiveRegistration(userAId, shiftAId);
        if (!regA) throw new ErrorResponse(400, 'Bạn không có ca này hoặc ca đã bị hủy');

        const shiftA = await SwapRequestRepository.findShiftWithTemplate(shiftAId);
        if (!shiftA) throw new ErrorResponse(404, 'Ca của bạn không tồn tại');
        if (this._isShiftPassed(shiftA.shift_date)) {
            throw new ErrorResponse(400, 'Không thể đổi ca đã qua');
        }
        if (this._isWithin2Days(shiftA.shift_date)) {
            throw new ErrorResponse(400, 'Chỉ được yêu cầu đổi ca trước ít nhất 2 ngày');
        }

        // 6. Nếu là đổi 2 chiều → B phải có ca shiftB và ca chưa qua
        if (shiftBId) {
            const regB = await SwapRequestRepository.findActiveRegistration(userBId, shiftBId);
            if (!regB) throw new ErrorResponse(400, 'Người nhận không có ca được chọn để đổi');

            const shiftB = await SwapRequestRepository.findShiftWithTemplate(shiftBId);
            if (!shiftB) throw new ErrorResponse(404, 'Ca của người nhận không tồn tại');
            if (this._isShiftPassed(shiftB.shift_date)) {
                throw new ErrorResponse(400, 'Ca của người nhận đã qua, không thể đổi');
            }

            // Kiểm tra trùng giờ: A nhận ca B → A có bị trùng không?
            await this._checkTimeConflict(userAId, shiftB, shiftAId);
            // Kiểm tra trùng giờ: B nhận ca A → B có bị trùng không?
            await this._checkTimeConflict(userBId, shiftA, shiftBId);
        } else {
            // Nhường ca: B nhận ca A → B có bị trùng không?
            await this._checkTimeConflict(userBId, shiftA, null);
        }

        // 7. Kiểm tra A đã gửi yêu cầu đổi ca này cho B chưa
        const isDuplicate = await SwapRequestRepository.checkPendingDuplicate(
            userAId, shiftAId, userBId,
        );
        if (isDuplicate) {
            throw new ErrorResponse(400, 'Bạn đã gửi yêu cầu đổi ca này cho người này rồi');
        }

        // 8. Tạo yêu cầu
        const newSwap = await SwapRequestRepository.createSwapRequest({
            requester_id: userAId,
            requester_shift_id: shiftAId,
            receiver_id: userBId,
            receiver_shift_id: shiftBId,
        });

        return this._formatSwap(newSwap);
    }

    // ================================================
    // B ĐỒNG Ý → THỰC THI SWAP NGAY
    // ================================================
    async acceptSwapRequest(swapId, currentUserId) {
        // 1. Lấy yêu cầu, kiểm tra còn pending không
        const swap = await this._getSwapOrThrow(swapId);

        // 2. Chỉ người nhận (B) mới được accept
        if (swap.receiver_id !== Number(currentUserId)) {
            throw new ErrorResponse(403, 'Bạn không phải người nhận yêu cầu này');
        }

        const today = this._todayStr();

        // 3. Kiểm tra lại lần cuối trước khi swap — ca có thể đã qua từ lúc tạo request
        const shiftA = await SwapRequestRepository.findShiftWithTemplate(swap.requester_shift_id);
        if (this._isShiftPassed(shiftA.shift_date)) {
            throw new ErrorResponse(400, 'Ca của người gửi đã qua, không thể thực hiện đổi');
        }

        const regA = await SwapRequestRepository.findActiveRegistration(
            swap.requester_id, swap.requester_shift_id,
        );
        if (!regA) throw new ErrorResponse(400, 'Ca của người gửi đã bị thay đổi, không thể đổi');

        const isExchange = !!swap.receiver_shift_id;

        if (isExchange) {
            // === EXCHANGE: A và B đổi ca cho nhau ===
            const shiftB = await SwapRequestRepository.findShiftWithTemplate(swap.receiver_shift_id);
            if (this._isShiftPassed(shiftB.shift_date)) {
                throw new ErrorResponse(400, 'Ca của bạn đã qua, không thể thực hiện đổi');
            }

            const regB = await SwapRequestRepository.findActiveRegistration(
                swap.receiver_id, swap.receiver_shift_id,
            );
            if (!regB) throw new ErrorResponse(400, 'Ca của bạn đã bị thay đổi, không thể đổi');

            // Kiểm tra trùng giờ lần cuối
            await this._checkTimeConflict(swap.requester_id, shiftB, swap.requester_shift_id);
            await this._checkTimeConflict(swap.receiver_id, shiftA, swap.receiver_shift_id);

            // - UPDATE regA → swapped_out, UPDATE regB → swapped_out
            // - INSERT A vào shiftB (swapped_in), INSERT B vào shiftA (swapped_in)
            await SwapRequestRepository.doExchange({
                swapId,
                regAId: regA.id,
                regBId: regB.id,
                userAId: swap.requester_id,
                shiftAId: swap.requester_shift_id,
                userBId: swap.receiver_id,
                shiftBId: swap.receiver_shift_id,
            });

        } else {
            // === GIVE AWAY: A nhường ca cho B ===
            await this._checkTimeConflict(swap.receiver_id, shiftA, null);

            // Thực thi:
            // - UPDATE regA → swapped_out
            // - INSERT B vào shiftA (swapped_in)
            await SwapRequestRepository.doGiveAway({
                swapId,
                regAId: regA.id,
                userBId: swap.receiver_id,
                shiftAId: swap.requester_shift_id,
            });
        }

        // Cập nhật status → accepted
        const updated = await SwapRequestRepository.updateStatus(swapId, 'accepted');
        return this._formatSwap(updated);
    }

    // ================================================
    // B TỪ CHỐI
    // ================================================
    async rejectSwapRequest(swapId, currentUserId) {
        const swap = await this._getSwapOrThrow(swapId);

        if (swap.receiver_id !== Number(currentUserId)) {
            throw new ErrorResponse(403, 'Bạn không phải người nhận yêu cầu này');
        }

        const updated = await SwapRequestRepository.updateStatus(swapId, 'rejected');
        return this._formatSwap(updated);
    }

    // ================================================
    // A HỦY YÊU CẦU
    // ================================================
    async cancelSwapRequest(swapId, currentUserId) {
        const swap = await this._getSwapOrThrow(swapId);

        if (swap.requester_id !== Number(currentUserId)) {
            throw new ErrorResponse(403, 'Bạn không phải người gửi yêu cầu này');
        }

        const updated = await SwapRequestRepository.updateStatus(swapId, 'cancelled');
        return this._formatSwap(updated);
    }

    // ================================================
    // LẤY DANH SÁCH CỦA MÌNH
    // ================================================
    async getMySwapRequests(userId) {
        const rows = await SwapRequestRepository.findByUserId(Number(userId));
        return rows.map((row) => this._formatSwap(row));
    }

    // ================================================
    // XEM CHI TIẾT
    // ================================================
    async getSwapRequestById(swapId, currentUserId) {
        const swap = await SwapRequestRepository.findById(swapId);
        if (!swap) throw new ErrorResponse(404, 'Yêu cầu đổi ca không tồn tại');

        // Chỉ 2 người liên quan mới được xem
        const isInvolved =
            swap.requester_id === Number(currentUserId) ||
            swap.receiver_id === Number(currentUserId);

        if (!isInvolved) {
            throw new ErrorResponse(403, 'Bạn không có quyền xem yêu cầu này');
        }

        return this._formatSwap(swap);
    }

    // ================================================
    // HELPERS
    // ================================================

    // Lấy swap request, ném lỗi nếu không tồn tại hoặc không còn pending
    async _getSwapOrThrow(swapId) {
        const swap = await SwapRequestRepository.findById(Number(swapId));
        if (!swap) throw new ErrorResponse(404, 'Yêu cầu đổi ca không tồn tại');
        if (swap.status !== 'pending') {
            throw new ErrorResponse(400, `Yêu cầu đã ở trạng thái ${swap.status}, không thể xử lý`);
        }
        return swap;
    }

    /**
     * Convert Date object hoặc string → 'YYYY-MM-DD' (theo LOCAL time, tránh lệch timezone UTC+7).
     * Dùng getFullYear/getMonth/getDate thay vì toISOString() để không bị shift ngày.
     */
    _toDateStr(shiftDate) {
        if (typeof shiftDate === 'string') return shiftDate.slice(0, 10);
        const y = shiftDate.getFullYear();
        const m = String(shiftDate.getMonth() + 1).padStart(2, '0');
        const d = String(shiftDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Ngày hôm nay dạng 'YYYY-MM-DD' (local time)
    _todayStr() {
        return this._toDateStr(new Date());
    }

    // Kiểm tra ca đã qua chưa
    _isShiftPassed(shiftDate) {
        return this._toDateStr(shiftDate) < this._todayStr();
    }

    /**
     * Kiểm tra ca có nằm trong vòng 2 ngày tới không (tính theo local time).
     * Ví dụ: hôm nay 5/4 → minAllowed = 7/4
     *   ca 6/4: "2026-04-06" < "2026-04-07" → true  → bị chặn 
     *   ca 7/4: "2026-04-07" < "2026-04-07" → false → cho phép 
     */
    _isWithin2Days(shiftDate) {
        const dateStr = this._toDateStr(shiftDate);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 2); // today + 2 ngày, local time
        return dateStr < this._toDateStr(minDate);
    }

    /**
     * Kiểm tra user có bị trùng giờ khi nhận ca mới không.
     *
     * @param userId        - user sắp nhận ca mới
     * @param newShift      - ca mới sắp nhận (object có shift_date, start_time, end_time)
     * @param excludeShiftId - ca sắp trả đi (bỏ qua khi check) — null nếu không có
     */
    async _checkTimeConflict(userId, newShift, excludeShiftId) {
        const date = this._toDateStr(newShift.shift_date);

        // Lấy tất cả ca user đang làm trong ngày đó
        const shiftsOnSameDay = await SwapRequestRepository.findUserShiftsOnDate(userId, date);

        // Bỏ qua ca sắp trả đi (dùng cho exchange)
        const shiftsToCheck = excludeShiftId
            ? shiftsOnSameDay.filter((s) => Number(s.shift_id) !== Number(excludeShiftId))
            : shiftsOnSameDay;

        // Chuyển "HH:MM:SS" sang số phút để so sánh dễ hơn
        const toMinutes = (timeStr) => {
            const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
            return h * 60 + m;
        };

        const newStart = toMinutes(newShift.start_time);
        const newEnd = toMinutes(newShift.end_time);

        for (const shift of shiftsToCheck) {
            const existStart = toMinutes(shift.start_time);
            const existEnd = toMinutes(shift.end_time);

            // Trùng giờ khi: ca mới bắt đầu trước khi ca cũ kết thúc
            //                VÀ ca mới kết thúc sau khi ca cũ bắt đầu
            const isOverlap = newStart < existEnd && newEnd > existStart;
            if (isOverlap) {
                throw new ErrorResponse(
                    400,
                    `Trùng giờ với ${shift.template_name} (${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}) ngày ${date}`,
                );
            }
        }
    }

    // Format response trả về cho client
    _formatSwap(row) {
        const isExchange = !!row.receiver_shift_id;

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
                date: row.requester_shift_date?.toString().slice(0, 10),
                template_name: row.requester_template_name,
                start_time: row.requester_start_time,
                end_time: row.requester_end_time,
                color: row.requester_color,
            },
            receiver_shift: isExchange ? {
                shift_id: row.receiver_shift_id,
                date: row.receiver_shift_date?.toString().slice(0, 10),
                template_name: row.receiver_template_name,
                start_time: row.receiver_start_time,
                end_time: row.receiver_end_time,
                color: row.receiver_color,
            } : null,
            responded_at: row.responded_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}

module.exports = new SwapRequestService();