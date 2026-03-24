import { useState } from 'react';
import {
  ChevronDown, Edit3, Trash2, PackageCheck,
  Clock, ChefHat, CheckCircle2, Ban,
} from 'lucide-react';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

export const STATUS_CONFIG = {
  pending:   { label: 'Chờ pha chế',  color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Clock,        dot: 'bg-amber-400'  },
  preparing: { label: 'Đang pha chế', color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: ChefHat,      dot: 'bg-blue-400'   },
  served:    { label: 'Sẵn sàng',     color: 'bg-green-100 text-green-700 border-green-200',  icon: PackageCheck, dot: 'bg-green-400'  },
  completed: { label: 'Hoàn thành',   color: 'bg-gray-100 text-gray-500 border-gray-200',     icon: CheckCircle2, dot: 'bg-gray-400'   },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-500 border-red-200',        icon: Ban,          dot: 'bg-red-400'    },
};

/**
 * @param {{ order: Object, onEdit: Function, onCancel: Function, onComplete: Function }} props
 */
export function OrderCard({ order, onEdit, onCancel, onComplete }) {
  const [expanded, setExpanded] = useState(false);

  const cfg  = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const canEdit     = order.status === 'pending';
  const canCancel   = order.status === 'pending';
  const canComplete = order.status === 'served';

  return (
    <div
      className={`rounded-xl border-2 bg-white overflow-hidden transition-all ${
        order.status === 'served'
          ? 'border-green-300 shadow-green-100 shadow-md'
          : 'border-gray-100'
      }`}
    >
      {/* ── Header ── */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
          <span className="font-bold text-gray-800 text-sm">
            #{order.order_id || order.id}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
            <Icon size={10} className="inline mr-1" />
            {cfg.label}
          </span>
        </div>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ── Tóm tắt + actions ── */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            {order.items?.length || 0} món · {fmt(order.total_amount)}
          </p>
          {order.payment_adjustment && (
            <p
              className={`text-xs font-medium ${
                order.payment_adjustment.type === 'refund'
                  ? 'text-red-500'
                  : 'text-blue-500'
              }`}
            >
              {order.payment_adjustment.message}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          {canEdit && (
            <button
              onClick={() => onEdit(order)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100"
            >
              <Edit3 size={11} /> Sửa
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100"
            >
              <Trash2 size={11} /> Hủy
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onComplete(order)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600"
            >
              <PackageCheck size={11} /> Giao
            </button>
          )}
        </div>
      </div>

      {/* ── Chi tiết (expand) ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2 space-y-1.5 bg-gray-50">
          {(order.items || []).map((item, i) => (
            <div key={i} className="text-xs">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">
                  {item.product_name} ({item.size}) × {item.quantity}
                </span>
                <span className="text-gray-600">
                  {fmt((item.unit_price || item.price) * item.quantity)}
                </span>
              </div>
              {item.toppings?.length > 0 && (
                <p className="text-gray-400 pl-2">
                  + {item.toppings.map((t) => t.name).join(', ')}
                </p>
              )}
              {item.note && (
                <p className="text-amber-500 italic pl-2">"{item.note}"</p>
              )}
            </div>
          ))}

          {order.discount_code && (
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
              <span className="text-green-600">Mã: {order.discount_code}</span>
              <span className="text-green-600">-{fmt(order.discount_amount || 0)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold pt-1 border-t border-gray-200">
            <span>Tổng</span>
            <span className="text-amber-600">{fmt(order.total_amount)}</span>
          </div>

          <div className="text-xs text-gray-400">
            {order.payment?.method === 'cash' ? '💵 Tiền mặt' : '📱 QR PayOS'} ·{' '}
            {order.is_paid ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
          </div>
        </div>
      )}
    </div>
  );
}