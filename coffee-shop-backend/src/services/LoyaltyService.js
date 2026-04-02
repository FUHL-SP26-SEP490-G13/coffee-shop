const ErrorResponse = require("../utils/ErrorResponse");
const { ROLES } = require("../config/constants");
const LoyaltyRepository = require("../repositories/LoyaltyRepository");
const UserRepository = require("../repositories/UserRepository");

class LoyaltyService {
  static MONEY_PER_POINT = 100;

  static EARN_PER_VND = 10000;

  static TX_TYPES = {
    EARN: "EARN",
    SPEND: "SPEND",
    REFUND: "REFUND",
    ADJUST: "ADJUST",
  };

  static SOURCES = {
    ORDER_SUCCESS: "ORDER_SUCCESS",
    ORDER_REDEEM: "ORDER_REDEEM",
    ORDER_CANCEL: "ORDER_CANCEL",
    ADMIN_INCREASE: "ADMIN_INCREASE",
    ADMIN_DECREASE: "ADMIN_DECREASE",
  };

  normalizePoints(value, { allowZero = true } = {}) {
    const number = Number(value);

    if (!Number.isInteger(number)) {
      throw new ErrorResponse(400, "Số điểm phải là số nguyên");
    }

    if (number < 0 || (!allowZero && number === 0)) {
      throw new ErrorResponse(400, "Số điểm không hợp lệ");
    }

    return number;
  }

  calculateRedeemAmount(usedPoints) {
    const safePoints = Math.max(0, Number(usedPoints) || 0);
    return safePoints * LoyaltyService.MONEY_PER_POINT;
  }

  calculateEarnedPoints(orderAmount) {
    const safeAmount = Math.max(0, Number(orderAmount) || 0);
    return Math.floor(safeAmount / LoyaltyService.EARN_PER_VND);
  }

  async getOrCreateWallet(connection, userId, { forUpdate = false } = {}) {
    await LoyaltyRepository.ensureWallet(connection, userId);
    return LoyaltyRepository.getWalletByUserId(userId, { connection, forUpdate });
  }

  async getRedeemDiscountForCheckout(
    connection,
    { userId, usedPoints, orderAmount }
  ) {
    const points = this.normalizePoints(usedPoints, { allowZero: true });
    if (points === 0) return 0;

    if (!userId) {
      throw new ErrorResponse(401, "Bạn cần đăng nhập để sử dụng điểm loyalty");
    }

    const wallet = await this.getOrCreateWallet(connection, userId);
    const totalPoints = Number(wallet?.total_points || 0);

    if (totalPoints < points) {
      throw new ErrorResponse(400, "Số điểm hiện tại không đủ để sử dụng");
    }

    const redeemAmount = this.calculateRedeemAmount(points);
    if (redeemAmount > Number(orderAmount || 0)) {
      throw new ErrorResponse(400, "Số điểm vượt quá giá trị đơn hàng hiện tại");
    }

    return redeemAmount;
  }

  async applyRedeemForOrder(connection, { userId, orderId, usedPoints }) {
    const points = this.normalizePoints(usedPoints, { allowZero: true });
    if (points === 0) {
      return { applied: false, used_points: 0, discount_amount: 0 };
    }

    if (!userId) {
      throw new ErrorResponse(401, "Bạn cần đăng nhập để sử dụng điểm loyalty");
    }

    const existingSpend = await LoyaltyRepository.findTransaction(connection, {
      userId,
      type: LoyaltyService.TX_TYPES.SPEND,
      source: LoyaltyService.SOURCES.ORDER_REDEEM,
      referenceId: orderId,
    });

    if (existingSpend) {
      return {
        applied: false,
        duplicated: true,
        used_points: points,
        discount_amount: this.calculateRedeemAmount(points),
      };
    }

    const wallet = await this.getOrCreateWallet(connection, userId, {
      forUpdate: true,
    });

    const totalPoints = Number(wallet?.total_points || 0);
    if (totalPoints < points) {
      throw new ErrorResponse(400, "Số điểm hiện tại không đủ để sử dụng");
    }

    await LoyaltyRepository.updateWalletPoints(connection, userId, {
      totalPointsDelta: -points,
      lifetimePointsDelta: 0,
    });

    await LoyaltyRepository.createTransaction(connection, {
      userId,
      type: LoyaltyService.TX_TYPES.SPEND,
      points,
      source: LoyaltyService.SOURCES.ORDER_REDEEM,
      referenceId: orderId,
    });

    return {
      applied: true,
      used_points: points,
      discount_amount: this.calculateRedeemAmount(points),
    };
  }

  async syncOrderLoyaltyByOrderId(orderId, { connection = null } = {}) {
    const externalConnection = Boolean(connection);
    const conn = connection || (await LoyaltyRepository.getConnection());

    try {
      if (!externalConnection) {
        await conn.beginTransaction();
      }

      const order = await LoyaltyRepository.findOrderSnapshot(orderId, {
        connection: conn,
        forUpdate: true,
      });

      if (!order || !order.user_id) {
        if (!externalConnection) {
          await conn.commit();
        }
        return { synced: false, reason: "order_or_user_not_found" };
      }

      const userId = Number(order.user_id);
      const status = String(order.status || "").toLowerCase();

      if (status === "completed") {
        const pointsToEarn = this.calculateEarnedPoints(order.total_amount);

        if (pointsToEarn > 0) {
          const existingEarn = await LoyaltyRepository.findTransaction(conn, {
            userId,
            type: LoyaltyService.TX_TYPES.EARN,
            source: LoyaltyService.SOURCES.ORDER_SUCCESS,
            referenceId: order.id,
          });

          if (!existingEarn) {
            await this.getOrCreateWallet(conn, userId, { forUpdate: true });
            await LoyaltyRepository.updateWalletPoints(conn, userId, {
              totalPointsDelta: pointsToEarn,
              lifetimePointsDelta: pointsToEarn,
            });

            await LoyaltyRepository.createTransaction(conn, {
              userId,
              type: LoyaltyService.TX_TYPES.EARN,
              points: pointsToEarn,
              source: LoyaltyService.SOURCES.ORDER_SUCCESS,
              referenceId: order.id,
            });
          }
        }
      }

      if (status === "cancelled") {
        const usedPoints = Number(order.used_points || 0);

        if (usedPoints > 0) {
          const existingRefund = await LoyaltyRepository.findTransaction(conn, {
            userId,
            type: LoyaltyService.TX_TYPES.REFUND,
            source: LoyaltyService.SOURCES.ORDER_CANCEL,
            referenceId: order.id,
          });

          const spendTx = await LoyaltyRepository.findTransaction(conn, {
            userId,
            type: LoyaltyService.TX_TYPES.SPEND,
            source: LoyaltyService.SOURCES.ORDER_REDEEM,
            referenceId: order.id,
          });

          if (!existingRefund && spendTx) {
            await this.getOrCreateWallet(conn, userId, { forUpdate: true });

            await LoyaltyRepository.updateWalletPoints(conn, userId, {
              totalPointsDelta: usedPoints,
              lifetimePointsDelta: 0,
            });

            await LoyaltyRepository.createTransaction(conn, {
              userId,
              type: LoyaltyService.TX_TYPES.REFUND,
              points: usedPoints,
              source: LoyaltyService.SOURCES.ORDER_CANCEL,
              referenceId: order.id,
            });
          }
        }
      }

      if (!externalConnection) {
        await conn.commit();
      }

      return { synced: true };
    } catch (error) {
      if (!externalConnection) {
        await conn.rollback();
      }
      throw error;
    } finally {
      if (!externalConnection) {
        conn.release();
      }
    }
  }

  async getMyLoyalty(userId) {
    const connection = await LoyaltyRepository.getConnection();

    try {
      await connection.beginTransaction();
      const wallet = await this.getOrCreateWallet(connection, userId, {
        forUpdate: true,
      });
      await connection.commit();

      return {
        user_id: userId,
        total_points: Number(wallet?.total_points || 0),
        lifetime_points: Number(wallet?.lifetime_points || 0),
        redeem_value_vnd:
          Number(wallet?.total_points || 0) * LoyaltyService.MONEY_PER_POINT,
        updated_at: wallet?.updated_at || null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getMyTransactions(userId, { page = 1, limit = 20, type = null } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const normalizedType = type ? String(type).toUpperCase() : null;

    const [transactions, total] = await Promise.all([
      LoyaltyRepository.listTransactionsByUser(userId, {
        limit: safeLimit,
        offset,
        type: normalizedType,
      }),
      LoyaltyRepository.countTransactionsByUser(userId, {
        type: normalizedType,
      }),
    ]);

    return {
      data: transactions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getCustomerLoyalties({ page = 1, limit = 20, keyword = "" } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const normalizedKeyword = String(keyword || "").trim();

    const [customers, total] = await Promise.all([
      LoyaltyRepository.listCustomerLoyalties({
        keyword: normalizedKeyword || null,
        limit: safeLimit,
        offset,
      }),
      LoyaltyRepository.countCustomerLoyalties({
        keyword: normalizedKeyword || null,
      }),
    ]);

    return {
      data: customers,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getCustomerLoyaltyDetail(userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ErrorResponse(404, "Người dùng không tồn tại");
    }

    if (Number(user.role_id) !== ROLES.CUSTOMER) {
      throw new ErrorResponse(400, "Chỉ hỗ trợ loyalty cho tài khoản customer");
    }

    const wallet = await this.getMyLoyalty(Number(userId));

    return {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
      loyalty: wallet,
    };
  }

  async adjustPointsByAdmin({ userId, points, source }) {
    const delta = Number(points);

    if (!Number.isInteger(delta) || delta === 0) {
      throw new ErrorResponse(400, "Điểm điều chỉnh phải là số nguyên và khác 0");
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new ErrorResponse(404, "Người dùng không tồn tại");
    }

    if (Number(user.role_id) !== ROLES.CUSTOMER) {
      throw new ErrorResponse(400, "Chỉ hỗ trợ loyalty cho tài khoản customer");
    }

    const connection = await LoyaltyRepository.getConnection();

    try {
      await connection.beginTransaction();

      const wallet = await this.getOrCreateWallet(connection, userId, {
        forUpdate: true,
      });
      const totalPoints = Number(wallet?.total_points || 0);

      if (delta < 0 && totalPoints < Math.abs(delta)) {
        throw new ErrorResponse(400, "Số điểm hiện tại không đủ để trừ");
      }

      await LoyaltyRepository.updateWalletPoints(connection, userId, {
        totalPointsDelta: delta,
        lifetimePointsDelta: 0,
      });

      const txSource =
        String(source || "").trim() ||
        (delta > 0
          ? LoyaltyService.SOURCES.ADMIN_INCREASE
          : LoyaltyService.SOURCES.ADMIN_DECREASE);

      await LoyaltyRepository.createTransaction(connection, {
        userId,
        type: LoyaltyService.TX_TYPES.ADJUST,
        points: Math.abs(delta),
        source: txSource.slice(0, 50),
        referenceId: null,
      });

      const updatedWallet = await LoyaltyRepository.getWalletByUserId(userId, {
        connection,
      });

      await connection.commit();

      return {
        user_id: userId,
        adjusted_points: delta,
        total_points: Number(updatedWallet?.total_points || 0),
        lifetime_points: Number(updatedWallet?.lifetime_points || 0),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new LoyaltyService();
