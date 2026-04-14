import axiosClient from '@/services/axiosClient';

const reputationService = {
  /**
   * Lấy thông tin uy tín của khách hàng dựa trên số điện thoại
   * @param {string} phoneNumber - Số điện thoại đã chuẩn hóa
   * @returns {Promise<Object>} Thông tin uy tín gồm score, tier, is_frozen
   */
  getReputationProfile: async (phoneNumber) => {
    try {
      return await axiosClient.get(
        `/reputation/by-phone?phone=${encodeURIComponent(phoneNumber)}`
      );
    } catch (error) {
      console.error('Lỗi lấy thông tin uy tín:', error);
      // Nếu không tìm thấy, trả về điểm mặc định
      return {
        data: {
          phone_number: phoneNumber,
          current_score: 50,
          reputation_tier: 'SILVER',
          is_frozen: false,
        },
      };
    }
  },

  /**
   * Lấy lịch sử thay đổi điểm uy tín
   * @param {string} phoneNumber - Số điện thoại
   * @param {number} limit - Số bản ghi tối đa
   * @returns {Promise<Object>}
   */
  getReputationHistory: async (phoneNumber, limit = 10) => {
    try {
      return await axiosClient.get(`/reputation/history/${phoneNumber}?limit=${limit}`);
    } catch (error) {
      console.error('Lỗi lấy lịch sử uy tín:', error);
      return { data: [] };
    }
  },

  getAdminReputationList: async ({ page = 1, limit = 20, keyword = "", sort = "" } = {}) => {
    return await axiosClient.get('/reputation/admin', {
      params: {
        page,
        limit,
        keyword,
        sort,
      },
    });
  },

  getAdminReputationHistory: async (phoneNumber, limit = 50) => {
    return await axiosClient.get(
      `/reputation/admin/${encodeURIComponent(phoneNumber)}/history`,
      {
        params: { limit },
      }
    );
  },

  /**
   * Cập nhật điểm uy tín (dùng cho admin hoặc hệ thống)
   * @param {string} phoneNumber
   * @param {number} changeAmount
   * @param {string} reasonType
   * @param {number} orderId - Optional
   * @param {string} description - Optional
   * @returns {Promise<Object>}
   */
  updateReputationScore: async (phoneNumber, changeAmount, reasonType, orderId = null, description = '') => {
    try {
      return await axiosClient.post('/reputation/update', {
        phone_number: phoneNumber,
        change_amount: changeAmount,
        reason_type: reasonType,
        order_id: orderId,
        description,
      });
    } catch (error) {
      console.error('Lỗi cập nhật điểm uy tín:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái tài khoản có bị đóng băng không
   * @param {string} phoneNumber
   * @returns {Promise<boolean>}
   */
  isReputationFrozen: async (phoneNumber) => {
    try {
      const res = await reputationService.getReputationProfile(phoneNumber);
      return res?.data?.is_frozen || false;
    } catch {
      return false;
    }
  },

  /**
   * Lấy tier uy tín dựa trên số điểm
   * @param {number} score - Điểm hiện tại
   * @returns {string} Tier: BRONZE, SILVER, GOLD, DIAMOND
   */
  getReputationTier: (score) => {
    if (score < 0) return 'BRONZE';
    if (score < 40) return 'BRONZE';
    if (score < 60) return 'SILVER';
    if (score < 85) return 'GOLD';
    return 'DIAMOND';
  },

  /**
   * Validate quyền sử dụng phương thức thanh toán dựa trên điểm uy tín
   *
   * @param {number} userScore - Điểm uy tín hiện tại
   * @param {number} orderTotal - Tổng tiền đơn hàng (VND)
   * @param {boolean} isBanned - Tài khoản bị chặn ?
   *
   * @returns {Object} {
   *   canUseCash: boolean,          // Có thể dùng tiền mặt không
   *   message: string,              // Thông báo cho người dùng
   *   forcePayOS: boolean,          // Bắt buộc dùng PayOS
   *   reason: string,               // Lý do (nếu có hạn chế)
   * }
   *
   * @throws {Error} Nếu tài khoản bị chặn
   *
   * QUYẾT ĐỊNH:
   * - nếu isBanned = true → throw 'Account Blocked'
   * - nếu score < 20 → chỉ PayOS, disable Cash
   * - nếu score 20-39 → Cash chỉ được nếu orderTotal < 30000
   * - nếu score 40-80 → Cash chỉ được nếu orderTotal < 100000
   * - nếu score > 80 → tất cả payment method được phép
   */
  validateOrderPermissions: (userScore, orderTotal, isBanned = false) => {
    const DEFAULT_SILVER_SCORE = 50;
    const score = typeof userScore === 'number' ? userScore : DEFAULT_SILVER_SCORE;

    // Rule 1: Tài khoản bị chặn
    if (isBanned) {
      throw new Error('Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản lý viên để được giải quyết.');
    }

    // Rule 2: Score < 20 → chỉ PayOS
    if (score < 20) {
      return {
        canUseCash: false,
        forcePayOS: true,
        message: 'Do điểm uy tín thấp, bạn chỉ có thể thanh toán bằng PayOS.',
        reason: `Điểm uy tín: ${score}/100 (dưới 20)`,
      };
    }

    // Rule 3: Score 20-39 → Cash chỉ nếu orderTotal < 30000
    if (score >= 20 && score < 40) {
      if (orderTotal >= 30000) {
        return {
          canUseCash: false,
          forcePayOS: true,
          message: `Tổng đơn ${(orderTotal).toLocaleString('vi-VN')}đ vượt quá hạn mức (30,000đ). Vui lòng dùng PayOS.`,
          reason: `Điểm uy tín: ${score}/100 (20-39) - giới hạn tiền mặt 30,000đ`,
        };
      }
      return {
        canUseCash: true,
        forcePayOS: false,
        message: `Bạn có thể dùng tiền mặt (tối đa 30,000đ) hoặc PayOS.`,
        reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt 30,000đ`,
      };
    }

    // Rule 4: Score 40-80 → Cash chỉ nếu orderTotal < 100000
    if (score >= 40 && score <= 80) {
      if (orderTotal >= 100000) {
        return {
          canUseCash: false,
          forcePayOS: true,
          message: `Tổng đơn ${(orderTotal).toLocaleString('vi-VN')}đ vượt quá hạn mức (100,000đ). Vui lòng dùng PayOS.`,
          reason: `Điểm uy tín: ${score}/100 (40-80) - giới hạn tiền mặt 100,000đ`,
        };
      }
      return {
        canUseCash: true,
        forcePayOS: false,
        message: `Bạn có thể dùng tiền mặt (tối đa 100,000đ) hoặc PayOS.`,
        reason: `Điểm uy tín: ${score}/100 - giới hạn tiền mặt 100,000đ`,
      };
    }

    // Rule 5: Score > 80 → tất cả phương thức
    return {
      canUseCash: true,
      forcePayOS: false,
      message: 'Bạn có thể sử dụng đầy đủ các phương thức thanh toán.',
      reason: `Điểm uy tín: ${score}/100 (trên 80) - không hạn chế`,
    };
  },
};

export default reputationService;
