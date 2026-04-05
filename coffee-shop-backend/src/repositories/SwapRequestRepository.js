const pool = require('../config/database');

class SwapRequestRepository {

    // ================================================
    // USERS
    // ================================================

    async findUserById(userId) {
        const [[row]] = await pool.query(
            `SELECT id, first_name, last_name, role_id, isActive
             FROM users
             WHERE id = ?`,
            [userId],
        );
        return row || null;
    }

    // ================================================
    // SWAP REQUESTS — CRUD
    // ================================================

    async createSwapRequest({ requester_id, requester_shift_id, receiver_id, receiver_shift_id }) {
        const [result] = await pool.query(
            `INSERT INTO shift_swap_requests
                (requester_id, requester_shift_id, receiver_id, receiver_shift_id, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [requester_id, requester_shift_id, receiver_id, receiver_shift_id || null],
        );
        return this.findById(result.insertId);
    }

    // Lấy chi tiết 1 swap request, join đủ thông tin cần thiết
    async findById(swapId) {
        const [[row]] = await pool.query(
            `SELECT
                ssr.*,

                -- Tên người gửi (A)
                u_req.first_name  AS requester_first_name,
                u_req.last_name   AS requester_last_name,

                -- Tên người nhận (B)
                u_rec.first_name  AS receiver_first_name,
                u_rec.last_name   AS receiver_last_name,

                -- Thông tin ca của A
                s_req.shift_date  AS requester_shift_date,
                st_req.name       AS requester_template_name,
                st_req.start_time AS requester_start_time,
                st_req.end_time   AS requester_end_time,
                st_req.color      AS requester_color,

                -- Thông tin ca của B (có thể NULL nếu là give away)
                s_rec.shift_date  AS receiver_shift_date,
                st_rec.name       AS receiver_template_name,
                st_rec.start_time AS receiver_start_time,
                st_rec.end_time   AS receiver_end_time,
                st_rec.color      AS receiver_color

             FROM shift_swap_requests ssr
             JOIN users          u_req  ON ssr.requester_id      = u_req.id
             JOIN users          u_rec  ON ssr.receiver_id       = u_rec.id
             JOIN shifts         s_req  ON ssr.requester_shift_id = s_req.id
             JOIN shift_templates st_req ON s_req.template_id    = st_req.id
             LEFT JOIN shifts         s_rec  ON ssr.receiver_shift_id = s_rec.id
             LEFT JOIN shift_templates st_rec ON s_rec.template_id   = st_rec.id
             WHERE ssr.id = ?`,
            [swapId],
        );
        return row || null;
    }

    // Lấy tất cả swap request của user (cả gửi lẫn nhận)
    async findByUserId(userId) {
        const [rows] = await pool.query(
            `SELECT
                ssr.*,
                u_req.first_name  AS requester_first_name,
                u_req.last_name   AS requester_last_name,
                u_rec.first_name  AS receiver_first_name,
                u_rec.last_name   AS receiver_last_name,
                s_req.shift_date  AS requester_shift_date,
                st_req.name       AS requester_template_name,
                st_req.start_time AS requester_start_time,
                st_req.end_time   AS requester_end_time,
                st_req.color      AS requester_color,
                s_rec.shift_date  AS receiver_shift_date,
                st_rec.name       AS receiver_template_name,
                st_rec.start_time AS receiver_start_time,
                st_rec.end_time   AS receiver_end_time,
                st_rec.color      AS receiver_color
             FROM shift_swap_requests ssr
             JOIN users          u_req  ON ssr.requester_id      = u_req.id
             JOIN users          u_rec  ON ssr.receiver_id       = u_rec.id
             JOIN shifts         s_req  ON ssr.requester_shift_id = s_req.id
             JOIN shift_templates st_req ON s_req.template_id    = st_req.id
             LEFT JOIN shifts         s_rec  ON ssr.receiver_shift_id = s_rec.id
             LEFT JOIN shift_templates st_rec ON s_rec.template_id   = st_rec.id
             WHERE ssr.requester_id = ? OR ssr.receiver_id = ?
             ORDER BY ssr.created_at DESC`,
            [userId, userId],
        );
        return rows;
    }

    // Kiểm tra đã có pending request trùng chưa
    async checkPendingDuplicate(requesterId, shiftId, receiverId) {
        const [[row]] = await pool.query(
            `SELECT id FROM shift_swap_requests
             WHERE requester_id       = ?
               AND requester_shift_id = ?
               AND receiver_id        = ?
               AND status             = 'pending'`,
            [requesterId, shiftId, receiverId],
        );
        return !!row; // trả về true/false
    }

    // Cập nhật status của swap request
    // responded_at chỉ set khi B accept hoặc reject (không set khi A cancel)
    async updateStatus(swapId, status) {
        const setRespondedAt = ['accepted', 'rejected'].includes(status)
            ? ', responded_at = NOW()'
            : '';

        await pool.query(
            `UPDATE shift_swap_requests
             SET status = ? ${setRespondedAt}
             WHERE id = ?`,
            [status, swapId],
        );
        return this.findById(swapId);
    }

    // ================================================
    // SHIFT REGISTRATIONS
    // ================================================

    // Tìm registration đang active của user cho ca này
    // Active = 'registered' (gán từ đầu) hoặc 'swapped_in' (nhận qua swap trước đó)
    async findActiveRegistration(userId, shiftId) {
        const [[row]] = await pool.query(
            `SELECT id, user_id, shift_id, status
             FROM shift_registrations
             WHERE user_id  = ?
               AND shift_id = ?
               AND status IN ('registered', 'swapped_in')`,
            [userId, shiftId],
        );
        return row || null;
    }

    // ================================================
    // THỰC THI SWAP
    // ================================================

    /**
     * EXCHANGE — A và B đổi ca cho nhau.
     *
     * Bước 1: UPDATE regA → swapped_out (A không làm shiftA nữa)
     * Bước 2: UPDATE regB → swapped_out (B không làm shiftB nữa)
     * Bước 3: INSERT A vào shiftB → swapped_in (A làm ca của B)
     * Bước 4: INSERT B vào shiftA → swapped_in (B làm ca của A)
     * Bước 5: Auto reject các pending swap khác liên quan đến 2 ca này
     */
    async doExchange({ swapId, regAId, regBId, userAId, shiftAId, userBId, shiftBId }) {

        // Bước 1 + 2: A và B đều trả ca cũ
        await pool.query(
            `UPDATE shift_registrations
             SET status = 'swapped_out'
             WHERE id IN (?)`,
            [[regAId, regBId]],
        );

        // Bước 3 + 4: A nhận ca B, B nhận ca A
        // ON DUPLICATE KEY UPDATE để xử lý trường hợp bản ghi đã tồn tại (ví dụ cancelled)
        await pool.query(
            `INSERT INTO shift_registrations (user_id, shift_id, status)
             VALUES (?, ?, 'swapped_in'),
                    (?, ?, 'swapped_in')
             ON DUPLICATE KEY UPDATE status = 'swapped_in'`,
            [userAId, shiftBId, userBId, shiftAId],
        );

        // Bước 5: Tự reject các pending request khác liên quan đến 2 ca này
        // (vì 2 ca đã swap xong rồi, không thể đổi tiếp)
        await pool.query(
            `UPDATE shift_swap_requests
             SET status = 'rejected', responded_at = NOW()
             WHERE status = 'pending'
               AND id != ?
               AND (
                   requester_shift_id IN (?) OR
                   receiver_shift_id  IN (?)
               )`,
            [swapId, [shiftAId, shiftBId], [shiftAId, shiftBId]],
        );
    }

    /**
     * GIVE AWAY — A nhường ca cho B.
     *
     * Bước 1: UPDATE regA → swapped_out (A không làm shiftA nữa)
     * Bước 2: INSERT B vào shiftA → swapped_in (B làm thay)
     * Bước 3: Auto reject các pending swap khác liên quan đến ca này
     */
    async doGiveAway({ swapId, regAId, userBId, shiftAId }) {

        // Bước 1: A trả ca
        await pool.query(
            `UPDATE shift_registrations
             SET status = 'swapped_out'
             WHERE id = ?`,
            [regAId],
        );

        // Bước 2: B nhận ca của A
        await pool.query(
            `INSERT INTO shift_registrations (user_id, shift_id, status)
             VALUES (?, ?, 'swapped_in')
             ON DUPLICATE KEY UPDATE status = 'swapped_in'`,
            [userBId, shiftAId],
        );

        // Bước 3: Tự reject các pending request khác liên quan đến ca này
        await pool.query(
            `UPDATE shift_swap_requests
             SET status = 'rejected', responded_at = NOW()
             WHERE status = 'pending'
               AND id != ?
               AND (requester_shift_id = ? OR receiver_shift_id = ?)`,
            [swapId, shiftAId, shiftAId],
        );
    }

    // ================================================
    // THÔNG TIN CA — dùng để validate
    // ================================================

    // Lấy thông tin ca kèm tên, giờ bắt đầu, giờ kết thúc từ template
    async findShiftWithTemplate(shiftId) {
        const [[row]] = await pool.query(
            `SELECT
                s.id,
                s.shift_date,
                st.name       AS template_name,
                st.start_time,
                st.end_time,
                st.color
             FROM shifts s
             JOIN shift_templates st ON s.template_id = st.id
             WHERE s.id = ?`,
            [shiftId],
        );
        return row || null;
    }

    // Lấy danh sách ca user đang làm trong ngày (để check trùng giờ)
    // Bỏ qua ca đã bị hủy hoặc đã đổi đi (swapped_out, cancelled)
    async findUserShiftsOnDate(userId, date) {
        const [rows] = await pool.query(
            `SELECT
                sr.shift_id,
                st.name       AS template_name,
                st.start_time,
                st.end_time
             FROM shift_registrations sr
             JOIN shifts          s  ON sr.shift_id   = s.id
             JOIN shift_templates st ON s.template_id = st.id
             WHERE sr.user_id   = ?
               AND s.shift_date = ?
               AND sr.status NOT IN ('cancelled', 'swapped_out')`,
            [userId, date],
        );
        return rows;
    }
}

module.exports = new SwapRequestRepository();