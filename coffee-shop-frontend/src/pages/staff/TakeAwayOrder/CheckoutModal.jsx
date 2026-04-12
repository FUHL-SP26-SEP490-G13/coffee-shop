import { useState } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Tag,
  Loader2,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import discountService from '@/services/discountService';
import PayOSLogo from "/logo/payOS.svg";

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
const roundCash = (amount) => {
  const remainder = amount % 1000;
  if (remainder >= 500) {
    return amount + (1000 - remainder);
  }
  return amount - remainder;
};
const CASH_SUGGESTIONS = [10000, 20000, 50000, 100000, 200000, 500000];

export function CheckoutModal({ subtotal, onClose, onConfirm, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [discountId, setDiscountId] = useState(null);

  const [receivedInput, setReceivedInput] = useState('');
  const [receivedError, setReceivedError] = useState('');

  const finalAmount = Math.max(0, subtotal - discountAmount);
  const cashFinalAmount = roundCash(finalAmount);

  const receivedAmt = Number(String(receivedInput).replace(/\D/g, '')) || 0;

  const changeAmount =
    paymentMethod === 'cash' ? Math.max(0, receivedAmt - cashFinalAmount) : 0;

  // Gợi ý mệnh giá
  const suggestions = (() => {
    const base = [
      cashFinalAmount,
      ...CASH_SUGGESTIONS.filter((v) => v > cashFinalAmount),
    ];
    const roundUp = Math.ceil(cashFinalAmount / 10000) * 10000;
    if (!base.includes(roundUp)) base.splice(1, 0, roundUp);
    return [...new Set(base)].slice(0, 4);
  })();

  // validate discount
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setCheckingDiscount(true);
    setDiscountError('');

    try {
      const discount = await discountService.getByCode(discountCode.trim());

      if (!discount) {
        setDiscountError('Mã giảm giá không tồn tại');
        return;
      }

      if (discount.deleted_at) {
        setDiscountError('Mã giảm giá không tồn tại');
        return;
      }

      const now = new Date();

      // thời gian
      if (discount.valid_from && now < new Date(discount.valid_from)) {
        setDiscountError('Mã giảm giá chưa đến thời gian sử dụng');
        return;
      }

      if (discount.valid_until && now > new Date(discount.valid_until)) {
        setDiscountError('Mã giảm giá đã hết hạn');
        return;
      }

      // FIX: usage (convert number)
      const usageLimit =
        discount.usage_limit == null ? null : Number(discount.usage_limit);
      const usedCount = Number(discount.used_count || 0);

      if (usageLimit !== null && usedCount >= usageLimit) {
        setDiscountError('Mã giảm giá đã hết lượt sử dụng');
        return;
      }

      const minOrder = Number(discount.min_order_amount || 0);

      if (subtotal < minOrder) {
        setDiscountError(`Đơn tối thiểu ${fmt(minOrder)} để dùng mã này`);
        return;
      }

      const percentage = Number(discount.percentage || 0);
      let amount = Math.round((subtotal * percentage) / 100);

      const maxDiscount =
        discount.max_discount_amount == null
          ? null
          : Number(discount.max_discount_amount);

      if (maxDiscount !== null) {
        amount = Math.min(amount, maxDiscount);
      }

      // không vượt quá subtotal
      amount = Math.min(subtotal, Math.max(0, amount));

      setDiscountAmount(amount);
      setDiscountId(discount.id);
      setDiscountApplied(true);
    } catch (e) {
      setDiscountError(
        e?.response?.data?.message || 'Mã giảm giá không tồn tại',
      );
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountApplied(false);
    setDiscountError('');
    setDiscountId(null);
  };

  // ─── Validate tiền khách đưa ──────────────────────────────────────────────
  const handleReceivedChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setReceivedInput(raw);
    setReceivedError('');
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (paymentMethod === 'cash') {
      if (!receivedAmt) {
        setReceivedError('Vui lòng nhập tiền khách đưa');
        return;
      }

      if (receivedAmt < cashFinalAmount) {
        setReceivedError(
          `Tiền khách đưa thiếu ${fmt(cashFinalAmount - receivedAmt)}`,
        );
        return;
      }
    }

    onConfirm({
      paymentMethod,
      discountCode: discountApplied ? discountCode : '',
      discountAmount,
      discountId,
      receivedAmount: paymentMethod === 'cash' ? receivedAmt : finalAmount,
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800'>
          <h3 className='font-bold text-gray-800 dark:text-gray-200 text-base'>Thanh toán</h3>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          >
            <X size={16} />
          </button>
        </div>

        <div className='p-5 space-y-4'>
          {/* Tóm tắt tiền */}
          <div className='bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2'>
            <div className='flex justify-between text-sm text-gray-500 dark:text-gray-400'>
              <span>Tổng tiền hàng</span>
              <span className='font-medium text-gray-800 dark:text-gray-200'>{fmt(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className='flex justify-between text-sm text-green-600 dark:text-green-400'>
                <span>Giảm giá ({discountCode})</span>
                <span>- {fmt(discountAmount)}</span>
              </div>
            )}
            <div className='flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-1'>
              <span className='text-gray-800 dark:text-gray-200'>Khách cần trả</span>
              <span className='text-amber-600 dark:text-amber-400 text-lg'>{fmt(finalAmount)}</span>
            </div>
          </div>

          {/* Mã giảm giá */}
          <div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
              Mã giảm giá
            </p>
            {discountApplied ? (
              <div className='flex items-center justify-between px-3 py-2.5 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 size={16} className='text-green-500' />
                  <span className='text-sm font-semibold text-green-700 dark:text-green-400'>
                    {discountCode}
                  </span>
                  <span className='text-xs text-green-600 dark:text-green-400'>
                    (- {fmt(discountAmount)})
                  </span>
                </div>
                <button
                  onClick={handleRemoveDiscount}
                  className='text-xs text-red-500 hover:text-red-700 font-medium'
                >
                  Xóa
                </button>
              </div>
            ) : (
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Tag
                    size={13}
                    className='absolute left-3 top-2.5 text-gray-400'
                  />
                  <input
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setDiscountError('');
                    }}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleApplyDiscount()
                    }
                    placeholder='Nhập mã giảm giá'
                    className={`w-full pl-8 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      discountError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 dark:border-gray-700 focus:border-amber-400 focus:ring-amber-100'
                    }`}
                  />
                </div>
                <button
                  onClick={handleApplyDiscount}
                  disabled={!discountCode.trim() || checkingDiscount}
                  className='px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 flex items-center gap-1.5 shrink-0'
                >
                  {checkingDiscount ? (
                    <Loader2 size={13} className='animate-spin' />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                  Áp dụng
                </button>
              </div>
            )}
            {discountError && (
              <div className='flex items-center gap-1.5 mt-1.5'>
                <AlertCircle size={13} className='text-red-500 shrink-0' />
                <p className='text-xs text-red-500'>{discountError}</p>
              </div>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
              Phương thức thanh toán
            </p>
            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <Banknote size={18} /> Tiền mặt
              </button>
              <button
                onClick={() => setPaymentMethod('payos')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  paymentMethod === 'payos'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <img src={PayOSLogo} alt="PayOS" className="h-10 w-10" />
                QR PayOS
              </button>
            </div>
          </div>

          {/* Cash: nhập tiền khách đưa */}
          {paymentMethod === 'cash' && (
            <div className='space-y-3 animate-in fade-in duration-150'>
              <div>
                <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  Tiền khách đưa
                </p>
                <input
                  type='text'
                  inputMode='numeric'
                  value={
                    receivedInput
                      ? Number(
                          String(receivedInput).replace(/\D/g, ''),
                        ).toLocaleString('vi-VN')
                      : ''
                  }
                  onChange={handleReceivedChange}
                  placeholder={
                    paymentMethod === 'cash'
                      ? fmt(cashFinalAmount) + ' (tiền mặt)'
                      : fmt(finalAmount)
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 transition-all ${
                    receivedError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 dark:border-gray-700 focus:border-green-400 focus:ring-green-100'
                  }`}
                />
                {receivedError && (
                  <div className='flex items-center gap-1.5 mt-1.5'>
                    <AlertCircle size={13} className='text-red-500 shrink-0' />
                    <p className='text-xs text-red-500'>{receivedError}</p>
                  </div>
                )}
              </div>

              {/* Gợi ý mệnh giá */}
              <div className='grid grid-cols-4 gap-2'>
                {suggestions.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setReceivedInput(String(v));
                      setReceivedError('');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                      receivedAmt === v
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50'
                    }`}
                  >
                    {v.toLocaleString('vi-VN')}
                  </button>
                ))}
              </div>

              {/* Tiền thừa */}
              {receivedAmt >= finalAmount && receivedAmt > 0 && (
                <div className='flex justify-between items-center px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100'>
                  <span className='text-sm text-blue-700 dark:text-blue-400'>
                    Tiền thừa trả khách
                  </span>
                  <span className='font-bold text-blue-700 dark:text-blue-400 text-base'>
                    {fmt(changeAmount)}
                  </span>
                </div>
              )}

              {/* Cảnh báo thiếu tiền */}
              {receivedAmt > 0 && receivedAmt < finalAmount && (
                <div className='flex justify-between items-center px-4 py-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100'>
                  <span className='text-sm text-red-600'>Còn thiếu</span>
                  <span className='font-bold text-red-600 text-base'>
                    {fmt(finalAmount - receivedAmt)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PayOS */}
          {paymentMethod === 'payos' && (
            <div className='p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 text-center animate-in fade-in duration-150'>
              <p className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                Hệ thống sẽ tạo mã QR sau khi xác nhận
              </p>
              <p className='text-xs text-blue-500 dark:text-blue-400 mt-1'>
                Khách quét QR để hoàn tất thanh toán
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-5 pb-5 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50'
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            className='flex-[2] py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg dark:shadow-none shadow-amber-200'
          >
            {loading ? (
              <>
                <Loader2 size={16} className='animate-spin' /> Đang xử lý...
              </>
            ) : paymentMethod === 'cash' ? (
              <>
                <Banknote size={16} /> Thanh toán
              </>
            ) : (
              <>
                <CreditCard size={16} /> Tạo QR thanh toán
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
