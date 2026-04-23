const ReputationRepository = require("../repositories/ReputationRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class ReputationService {
  static MIN_SCORE = 0;
  static MAX_SCORE = 100;

  static REASON_TYPES = {
    INITIAL_GIFT: "INITIAL_GIFT",
    ORDER_SUCCESS: "ORDER_SUCCESS",
    PAYOS_BONUS: "PAYOS_BONUS",
    USER_CANCEL: "USER_CANCEL",
    BOOM_ORDER: "BOOM_ORDER",
    ABUSIVE_BEHAVIOR: "ABUSIVE_BEHAVIOR",
    ADMIN_ADJUST: "ADMIN_ADJUST",
  };

  normalizePhoneNumber(phoneNumber) {
    const onlyDigits = String(phoneNumber || "").replace(/\D/g, "");
    if (!onlyDigits) return "";

    if (onlyDigits.startsWith("84") && onlyDigits.length >= 11) {
      return `0${onlyDigits.slice(2)}`;
    }

    if (onlyDigits.length === 9) {
      return `0${onlyDigits}`;
    }

    return onlyDigits;
  }

  async ensureProfileForPhone(connection, phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone || normalizedPhone.length < 10) return null;

    await ReputationRepository.createReputationProfileIfNotExists(
      connection,
      normalizedPhone,
    );

    return normalizedPhone;
  }

  async getReputationByPhone(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new ErrorResponse(400, "Số điện thoại không hợp lệ");
    }

    const profile = await ReputationRepository.findReputationProfileByPhone(
      normalizedPhone,
    );

    return {
      phone_number: normalizedPhone,
      current_score: Number(profile?.current_score ?? 50),
      total_orders_completed: Number(profile?.total_orders_completed || 0),
      total_orders_cancelled: Number(profile?.total_orders_cancelled || 0),
      is_frozen: Number(profile?.is_frozen || 0) === 1,
      updated_at: profile?.updated_at || null,
      exists: Boolean(profile),
    };
  }

  async getAdminReputationProfiles({ page = 1, limit = 20, keyword = "", sort = "" } = {}) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (normalizedPage - 1) * normalizedLimit;
    const trimmedKeyword = String(keyword || "").trim();

    const [items, total] = await Promise.all([
      ReputationRepository.findReputationProfiles({
        keyword: trimmedKeyword,
        sort,
        limit: normalizedLimit,
        offset,
      }),
      ReputationRepository.countReputationProfiles({ keyword: trimmedKeyword }),
    ]);

    return {
      items,
      pagination: {
        current_page: normalizedPage,
        limit: normalizedLimit,
        total,
        total_pages: Math.max(1, Math.ceil(total / normalizedLimit)),
      },
    };
  }

  async getAdminReputationHistoryByPhone(phoneNumber, { limit = 50 } = {}) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new ErrorResponse(400, "Số điện thoại không hợp lệ");
    }

    const normalizedLimit = Math.min(200, Math.max(1, Number(limit) || 50));

    const [profile, history] = await Promise.all([
      ReputationRepository.findReputationProfileByPhone(normalizedPhone),
      ReputationRepository.findReputationHistoryByPhone(normalizedPhone, {
        limit: normalizedLimit,
      }),
    ]);

    return {
      phone_number: normalizedPhone,
      current_score: Number(profile?.current_score ?? 50),
      total_orders_completed: Number(profile?.total_orders_completed || 0),
      total_orders_cancelled: Number(profile?.total_orders_cancelled || 0),
      is_frozen: Number(profile?.is_frozen || 0) === 1,
      updated_at: profile?.updated_at || null,
      history,
    };
  }

  normalizeReasonType(reasonType) {
    const raw = String(reasonType || "").trim().toUpperCase();
    if (!raw) return ReputationService.REASON_TYPES.ADMIN_ADJUST;

    const validValues = new Set(Object.values(ReputationService.REASON_TYPES));
    if (validValues.has(raw)) return raw;

    if (raw.includes("SUCCESS") || raw.includes("COMPLETED")) {
      return ReputationService.REASON_TYPES.ORDER_SUCCESS;
    }

    if (raw.includes("BOOM")) {
      return ReputationService.REASON_TYPES.BOOM_ORDER;
    }

    if (raw.includes("USER") && raw.includes("CANCEL")) {
      return ReputationService.REASON_TYPES.USER_CANCEL;
    }

    if (raw.includes("ABUSIVE")) {
      return ReputationService.REASON_TYPES.ABUSIVE_BEHAVIOR;
    }

    if (raw.includes("PAYOS") || raw.includes("BONUS")) {
      return ReputationService.REASON_TYPES.PAYOS_BONUS;
    }

    if (raw.includes("GIFT") || raw.includes("INITIAL")) {
      return ReputationService.REASON_TYPES.INITIAL_GIFT;
    }

    return ReputationService.REASON_TYPES.ADMIN_ADJUST;
  }

  async applyScoreChangeByOrder({
    orderId,
    changeAmount,
    reasonType,
    description,
    appliedMultiplier = 1,
  }) {
    const normalizedOrderId = Number(orderId || 0);
    const numericChange = Number(changeAmount || 0);
    const normalizedReasonType = this.normalizeReasonType(reasonType);

    if (!normalizedOrderId) {
      throw new ErrorResponse(400, "Thiếu mã đơn hàng để cập nhật điểm uy tín");
    }

    if (!Number.isFinite(numericChange) || numericChange === 0) {
      throw new ErrorResponse(400, "Giá trị cộng trừ điểm uy tín không hợp lệ");
    }

    const connection = await ReputationRepository.getConnection();
    try {
      await connection.beginTransaction();

      const deliveryInfo = await ReputationRepository.findDeliveryInfoByOrderId(
        connection,
        normalizedOrderId,
      );

      const normalizedPhone = this.normalizePhoneNumber(
        deliveryInfo?.receiver_phone,
      );

      if (!normalizedPhone || normalizedPhone.length < 10) {
        throw new ErrorResponse(
          400,
          "Không tìm thấy số điện thoại hợp lệ để cập nhật điểm uy tín",
        );
      }

      const existingOrderReasonHistory =
        await ReputationRepository.findReputationHistoryByOrderAndReason(
          connection,
          {
            orderId: normalizedOrderId,
            reasonType: normalizedReasonType,
          },
        );

      if (existingOrderReasonHistory) {
        await connection.commit();
        return {
          duplicated: true,
          order_id: normalizedOrderId,
          reason_type: normalizedReasonType,
          phone_number: normalizedPhone,
        };
      }

      await ReputationRepository.createReputationProfileIfNotExists(
        connection,
        normalizedPhone,
      );

      const profile = await ReputationRepository.findReputationProfileByPhoneForUpdate(
        connection,
        normalizedPhone,
      );

      const scoreBefore = Number(profile?.current_score ?? 50);
      let scoreAfter = scoreBefore + numericChange;

      if (numericChange > 0) {
        scoreAfter = Math.min(ReputationService.MAX_SCORE, scoreAfter);
      }

      if (numericChange < 0) {
        scoreAfter = Math.max(ReputationService.MIN_SCORE, scoreAfter);
      }

      const effectiveChange = scoreAfter - scoreBefore;

      const completedDelta =
        normalizedReasonType === ReputationService.REASON_TYPES.ORDER_SUCCESS
          ? 1
          : 0;
      const cancelledReasons = new Set([
        ReputationService.REASON_TYPES.USER_CANCEL,
        ReputationService.REASON_TYPES.BOOM_ORDER,
        ReputationService.REASON_TYPES.ABUSIVE_BEHAVIOR,
      ]);
      const cancelledDelta = cancelledReasons.has(normalizedReasonType) ? 1 : 0;

      await ReputationRepository.updateReputationProfileScore(connection, {
        phoneNumber: normalizedPhone,
        scoreAfter,
        completedDelta,
        cancelledDelta,
      });

      await ReputationRepository.createReputationHistory(connection, {
        phone_number: normalizedPhone,
        order_id: normalizedOrderId,
        score_before: scoreBefore,
        change_amount: effectiveChange,
        score_after: scoreAfter,
        applied_multiplier: Number(appliedMultiplier || 1),
        reason_type: normalizedReasonType,
        description,
      });

      await connection.commit();

      return {
        phone_number: normalizedPhone,
        score_before: scoreBefore,
        change_amount: effectiveChange,
        score_after: scoreAfter,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ReputationService();
