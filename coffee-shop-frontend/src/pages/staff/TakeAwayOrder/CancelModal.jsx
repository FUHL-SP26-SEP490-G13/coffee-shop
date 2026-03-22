import { AlertCircle, Trash2, Loader2 } from 'lucide-react';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

/**
 * @param {{ order: Object, onClose: Function, onConfirm: Function, loading: boolean }} props
 */
export function CancelModal({ order, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">

        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 text-center">
          Hủy đơn #{order.order_id || order.id}?
        </h3>

        {order.is_paid && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700 text-center font-medium">
              ⚠️ Đơn đã thanh toán {fmt(order.total_amount)}
              <br />
              <span className="text-xs font-normal">
                Hệ thống sẽ ghi nhận hoàn tiền cho khách
              </span>
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 text-center mt-3">
          Hành động này không thể hoàn tác.
        </p>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Hủy đơn
          </button>
        </div>
      </div>
    </div>
  );
}