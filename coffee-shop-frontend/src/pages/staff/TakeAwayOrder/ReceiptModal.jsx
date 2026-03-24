import { Coffee, Printer } from 'lucide-react';
import { useState } from 'react';
import { PrintableReceipt } from '../PrintableReceipt';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

const isOrderPaid = (order) => {
  const paymentStatus = String(
    order?.payment_status || order?.payment?.status || ''
  ).toLowerCase();
  if (paymentStatus === 'paid') return true;

  return (
    order?.is_paid === true ||
    order?.is_paid === 1 ||
    order?.is_paid === '1'
  );
};

const calcSubtotal = (order) =>
  (order.items || []).reduce((sum, item) => {
    const base = Number(item.unit_price || item.price || 0) * Number(item.quantity || 0);
    const topping = (item.toppings || []).reduce(
      (s, t) => s + Number(t.price || 0) * Number(t.quantity || 0),
      0
    );
    return sum + base + topping;
  }, 0);

/**
 * @param {{ order: Object, onClose: Function }} props
 */
export function ReceiptModal({ order, onClose }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const subtotal = calcSubtotal(order);
  const totalAmount = Number(order.total_amount || 0);
  const computedDiscount = Math.max(0, subtotal - totalAmount);

  if (isPrinting) {
    return <PrintableReceipt order={order} onDone={onClose} />;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">

        {/* Header */}
        <div className="bg-gray-800 text-white p-5 text-center">
          <Coffee size={28} className="mx-auto mb-2 text-amber-400" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">Hóa đơn</p>
          <h3 className="font-bold text-xl mt-1">
            {order.order_code || `TW-${String(order.order_id).padStart(6, '0')}`}
          </h3>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Nhân viên</span>
            <span className="font-medium text-gray-800">{order.staff || '—'}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-500">
            <span>Người in</span>
            <span className="font-medium text-gray-800">{order.printed_by || order.staff || '—'}</span>
          </div>

          {order.barista && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Barista</span>
              <span className="font-medium text-gray-800">{order.barista}</span>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
            {(order.items || []).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product_name} ({item.size}) × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {fmt((item.unit_price || item.price) * item.quantity)}
                  </span>
                </div>
                {item.toppings?.map((t, j) => (
                  <div key={j} className="flex justify-between text-xs text-gray-400 pl-3">
                    <span>+ {t.name} × {t.quantity}</span>
                    <span>+{fmt(t.price * t.quantity)}</span>
                  </div>
                ))}
                {item.note && (
                  <p className="text-xs text-amber-500 italic pl-3">"{item.note}"</p>
                )}
              </div>
            ))}
          </div>

          {computedDiscount > 0 && (
            <div className="flex justify-between text-sm border-t border-dashed border-gray-200 pt-3">
              <span className="text-green-600">
                Giảm giá{order.discount_code ? ` (${order.discount_code})` : ''}
              </span>
              <span className="text-green-600">-{fmt(computedDiscount)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-base font-bold border-t-2 border-gray-800 pt-3">
            <span>TỔNG CỘNG</span>
            <span className="text-amber-600">{fmt(order.total_amount)}</span>
          </div>

          {/* Payment status */}
          <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-gray-500">
            {(order.payment_method || order.payment?.method) === 'cash'
              ? '💵 Tiền mặt'
              : '📱 QR PayOS'}{' '}
            · {isOrderPaid(order) ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
          </div>

          {/* Adjustment */}
          {order.payment?.adjustment_amount != null && order.payment.adjustment_amount !== 0 && (
            <div
              className={`rounded-xl p-3 text-center text-sm font-medium ${
                order.payment.adjustment_amount < 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {order.payment.adjustment_amount < 0
                ? `Hoàn khách: ${fmt(Math.abs(order.payment.adjustment_amount))}`
                : `Thu thêm: ${fmt(order.payment.adjustment_amount)}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => setIsPrinting(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} />
            In hóa đơn
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}