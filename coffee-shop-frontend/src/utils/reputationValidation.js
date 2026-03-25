/**
 * Xác thực quyền sử dụng phương thức thanh toán dựa trên điểm uy tín
 *
 * @param {number} userScore - Điểm uy tín hiện tại (0-100)
 * @param {number} orderTotal - Tổng tiền đơn hàng (VND)
 * @param {boolean} isBanned - Tài khoản bị chặn?
 *
 * @returns {Object} {
 *   canUseCash: boolean,          // Có thể dùng tiền mặt không
 *   message: string,              // Thông báo cho người dùng
 *   forcePayOS: boolean,          // Bắt buộc dùng PayOS
 *   reason: string,               // Lý do (chi tiết hạn chế)
 * }
 *
 * @throws {Error} Nếu tài khoản bị chặn
 *
 * LOGIC QUYẾT ĐỊNH:
 * ─────────────────────────────────────────────────────────────────
 * 1. Nếu isBanned = true
 *    → Throw error: 'Account Blocked'
 *
 * 2. Nếu userScore < 20
 *    → Chỉ PayOS được phép, Disable Cash
 *
 * 3. Nếu userScore 20-39
 *    → Cash được phép nếu orderTotal < 30,000đ
 *    → Nếu vượt → force PayOS
 *
 * 4. Nếu userScore 40-80
 *    → Cash được phép nếu orderTotal < 100,000đ
 *    → Nếu vượt → force PayOS
 *
 * 5. Nếu userScore > 80
 *    → Tất cả payment methods được phép
 * ─────────────────────────────────────────────────────────────────
 */
export function validateOrderPermissions(userScore, orderTotal, isBanned = false) {
  const DEFAULT_REPUTATION_SCORE = 50;

  // Ensure score is a valid number
  const score = typeof userScore === 'number' && userScore >= 0 ? userScore : DEFAULT_REPUTATION_SCORE;

  // Rule 1: Account is blocked/frozen
  if (isBanned === true) {
    throw new Error(
      'Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản lý viên để được hỗ trợ.'
    );
  }

  // Rule 2: Score < 20 → Only PayOS allowed
  if (score < 20) {
    return {
      canUseCash: false,
      forcePayOS: true,
      message: '⚠️ Do điểm uy tín thấp, bạn chỉ có thể thanh toán bằng PayOS.',
      reason: `Điểm uy tín: ${score}/100 (dưới mức 20 điểm)`,
    };
  }

  // Rule 3: Score 20-39 → Cash only if orderTotal < 30,000
  if (score >= 20 && score < 40) {
    if (orderTotal >= 30000) {
      return {
        canUseCash: false,
        forcePayOS: true,
        message: `Tổng đơn hàng ${(orderTotal).toLocaleString('vi-VN')}đ vượt hạn mức (30,000đ). Vui lòng dùng PayOS.`,
        reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt: 30,000đ`,
      };
    }
    return {
      canUseCash: true,
      forcePayOS: false,
      message: `✓ Bạn có thể dùng tiền mặt (tối đa 30,000đ) hoặc PayOS.`,
      reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt: 30,000đ`,
    };
  }

  // Rule 4: Score 40-80 → Cash only if orderTotal < 100,000
  if (score >= 40 && score <= 80) {
    if (orderTotal >= 100000) {
      return {
        canUseCash: false,
        forcePayOS: true,
        message: `Tổng đơn hàng ${(orderTotal).toLocaleString('vi-VN')}đ vượt hạn mức (100,000đ). Vui lòng dùng PayOS.`,
        reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt: 100,000đ`,
      };
    }
    return {
      canUseCash: true,
      forcePayOS: false,
      message: `✓ Bạn có thể dùng tiền mặt (tối đa 100,000đ) hoặc PayOS.`,
      reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt: 100,000đ`,
    };
  }

  // Rule 5: Score > 80 → All methods allowed
  return {
    canUseCash: true,
    forcePayOS: false,
    message: '✓ Bạn có thể sử dụng đầy đủ những phương thức thanh toán.',
    reason: `Điểm uy tín: ${score}/100 (cao, không hạn chế)`,
  };
}

/**
 * Format điểm uy tín thành tier
 * @param {number} score - Điểm uy tín
 * @returns {string} Tier: BRONZE, SILVER, GOLD, DIAMOND
 */
export function getReputationTierLabel(score) {
  const validScore = typeof score === 'number' ? score : 50;
  
  if (validScore < 0) return 'BRONZE';
  if (validScore < 40) return 'BRONZE';
  if (validScore < 60) return 'SILVER';
  if (validScore < 85) return 'GOLD';
  return 'DIAMOND';
}

/**
 * Lấy màu sắc cho badge uy tín
 * @param {string} tier - Tier uy tín
 * @returns {string} Tailwind color class
 */
export function getReputationColor(tier) {
  const colorMap = {
    BRONZE: 'bg-amber-100 text-amber-900',
    SILVER: 'bg-slate-100 text-slate-900',
    GOLD: 'bg-yellow-100 text-yellow-900',
    DIAMOND: 'bg-blue-100 text-blue-900',
  };
  return colorMap[tier] || 'bg-gray-100 text-gray-900';
}

export default {
  validateOrderPermissions,
  getReputationTierLabel,
  getReputationColor,
};
