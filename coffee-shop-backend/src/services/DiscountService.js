const DiscountRepository = require('../repositories/DiscountRepository');
const ErrorResponse = require('../utils/ErrorResponse');

class DiscountService {
  async getAll(params) {
    return await DiscountRepository.findAll(params);
  }

  async getPublic() {
    return await DiscountRepository.findPublic();
  }

  async getById(id) {
    const discount = await DiscountRepository.findById(id);

    if (!discount) {
      throw new ErrorResponse(404, 'Không tìm thấy mã giảm giá');
    }

    return discount;
  }

  async getByCode(code) {
    const discount = await DiscountRepository.findByCodeFull(code);

    if (!discount) {
      throw new ErrorResponse(404, 'Mã giảm giá không tồn tại');
    }

    return discount;
  }

  async create(data) {
    const existing = await DiscountRepository.findByCode(data.code.trim());

    if (existing) {
      throw new ErrorResponse(400, 'Mã giảm giá đã tồn tại');
    }

    return await DiscountRepository.create({
      ...data,
      code: data.code.trim(),
      description: data.description?.trim() || null,
    });
  }

  async update(id, data) {
    const discount = await DiscountRepository.findById(id);

    if (!discount) {
      throw new ErrorResponse(404, 'Không tìm thấy mã giảm giá');
    }

    const usedCount = Number(discount.used_count || 0);

    if (usedCount > 0) {
      const allowedData = {};

      if (data.description !== undefined) {
        allowedData.description = data.description?.trim() || null;
      }

      if (data.valid_until !== undefined) {
        allowedData.valid_until = data.valid_until;
      }

      if (Object.keys(allowedData).length === 0) {
        throw new ErrorResponse(
          400,
          'Mã giảm giá đã được sử dụng, chỉ được sửa ngày kết thúc, mô tả',
        );
      }

      await DiscountRepository.update(id, allowedData);
      return true;
    }

    if (
      data.code &&
      data.code.trim().toLowerCase() !==
        String(discount.code).trim().toLowerCase()
    ) {
      const existing = await DiscountRepository.findByCode(data.code.trim());
      if (existing) {
        throw new ErrorResponse(400, 'Mã giảm giá đã tồn tại');
      }
    }

    await DiscountRepository.update(id, {
      ...data,
      code: data.code?.trim(),
      description:
        data.description !== undefined
          ? data.description?.trim() || null
          : undefined,
    });

    return true;
  }

  async delete(id) {
    const discount = await DiscountRepository.findById(id);

    if (!discount) {
      throw new ErrorResponse(404, 'Không tìm thấy mã giảm giá');
    }

    const usedCount = Number(discount.used_count || 0);
    if (usedCount === 0) {
      await DiscountRepository.hardDelete(id);
      return true;
    }

    const newCode = `${discount.code}__deleted__${discount.id}__${Date.now()}`;
    await DiscountRepository.softDelete(id, newCode);
    return true;
  }
}

module.exports = new DiscountService();
