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
export function validateOrderPermissions(userScore, orderTotal, isBanned = false, rules = []) {
  const DEFAULT_REPUTATION_SCORE = 50;

  // Ensure score is a valid number
  const score = typeof userScore === 'number' && userScore >= 0 ? userScore : DEFAULT_REPUTATION_SCORE;

  // Rule 1: Account is blocked/frozen
  if (isBanned === true) {
    throw new Error(
      'Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản lý để được hỗ trợ.'
    );
  }

  // Fallback nếu Admin chưa cấu hình rule nào
  if (!Array.isArray(rules) || rules.length === 0) {
    return {
      canUseCash: true,
      forcePayOS: false,
      message: '✓ Bạn có thể sử dụng đầy đủ những phương thức thanh toán.',
      reason: `Điểm uy tín: ${score}/100 (Hệ thống chưa giới hạn)`,
    };
  }

  // Sắp xếp rules giảm dần (từ mốc điểm cao nhất xuống thấp nhất)
  const sortedRules = [...rules].sort((a, b) => b.minScore - a.minScore);
  
  // Tìm mốc phù hợp (khoảng điểm hiện tại)
  let appliedRule = sortedRules.find(r => score >= r.minScore);
  
  // Nếu điểm của khách thấp hơn cả mốc thấp nhất, áp dụng luôn mốc thấp nhất đó
  if (!appliedRule) {
      appliedRule = sortedRules[sortedRules.length - 1]; 
  }

  const limit = appliedRule.maxCash;
  
  // Limit = 0 -> Cấm tiền mặt hoàn toàn (Chỉ PayOS)
  if (limit === 0) {
    return {
      canUseCash: false,
      forcePayOS: true,
      message: '⚠️ Theo hạn mức quy định tại mức điểm hiện tại, bạn chỉ có thể thanh toán qua PayOS.',
      reason: `Điểm uy tín: ${score}/100 (Mức từ ${appliedRule.minScore} điểm - Yêu cầu Online)`,
    };
  }
  
  // Limit = null -> Không giới hạn số tiền thanh toán COD
  if (limit === null) {
    return {
      canUseCash: true,
      forcePayOS: false,
      message: '✓ Bạn có thể sử dụng đầy đủ các phương thức thanh toán.',
      reason: `Điểm uy tín: ${score}/100 (Mức từ ${appliedRule.minScore} điểm - Không hạn chế COD)`,
    };
  }
  
  // Limit > 0 -> Cho phép tiền mặt trong hạn mức
  if (limit > 0) {
    if (orderTotal > limit) {
      return {
        canUseCash: false,
        forcePayOS: true,
        message: `Tổng đơn ${(orderTotal).toLocaleString('vi-VN')}đ vượt hạn mức (${limit.toLocaleString('vi-VN')}đ) của nhóm điểm bạn. Vui lòng dùng PayOS.`,
        reason: `Điểm uy tín: ${score}/100 (Mức từ ${appliedRule.minScore} điểm - Giới hạn Tiền mặt: ${limit.toLocaleString('vi-VN')}đ)`,
      };
    }
    
    return {
      canUseCash: true,
      forcePayOS: false,
      message: `✓ Bạn có thể dùng tiền mặt (tối đa ${limit.toLocaleString('vi-VN')}đ) hoặc PayOS.`,
      reason: `Điểm uy tín: ${score}/100 (Mức từ ${appliedRule.minScore} điểm - Giới hạn Tiền mặt: ${limit.toLocaleString('vi-VN')}đ)`,
    };
  }
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
