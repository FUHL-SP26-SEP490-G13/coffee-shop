const ReputationRepository = require("../repositories/ReputationRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class ReputationService {
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

  async getAdminReputationProfiles({ page = 1, limit = 20, keyword = "" } = {}) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (normalizedPage - 1) * normalizedLimit;
    const trimmedKeyword = String(keyword || "").trim();

    const [items, total] = await Promise.all([
      ReputationRepository.findReputationProfiles({
        keyword: trimmedKeyword,
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
}

module.exports = new ReputationService();
