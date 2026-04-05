-- ============================================================
-- Migration: Thêm cột updated_at cho shift_registrations
--            và shift_swap_requests
-- Date: 2026-04-05
-- ============================================================

-- 1. shift_registrations
--    Mỗi lần status thay đổi (registered → swapped_out, swapped_in, ...)
--    updated_at tự cập nhật để biết thời điểm thay đổi.
ALTER TABLE shift_registrations
    ADD COLUMN updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        AFTER created_at;


