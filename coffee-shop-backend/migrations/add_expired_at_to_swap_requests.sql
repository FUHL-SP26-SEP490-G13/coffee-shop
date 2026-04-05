-- Migration: Thêm cột expired_at vào bảng shift_swap_requests
-- Chạy 1 lần duy nhất trên database

ALTER TABLE shift_swap_requests
    ADD COLUMN expired_at DATETIME NULL
        COMMENT 'Thời điểm đơn hết hạn = giờ bắt đầu ca − SWAP_EXPIRE_HOURS (mặc định 12h)';

-- Verify
-- SELECT id, status, expired_at FROM shift_swap_requests LIMIT 10;
