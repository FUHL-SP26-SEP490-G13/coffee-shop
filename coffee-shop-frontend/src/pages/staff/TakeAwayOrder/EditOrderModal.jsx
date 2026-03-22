import { useState } from 'react';
import { X, Search, Minus, Plus, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { ProductModal } from './ProductModal';
import takeawayService from '@/services/takeAwayService';
import { toast } from 'sonner';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * @param {{
 *   order: Object,
 *   products: Array,   ← danh sách sản phẩm từ API
 *   toppings: Array,   ← danh sách topping từ API
 *   onClose: Function,
 *   onSave: Function,
 * }} props
 */
export function EditOrderModal({ order, products = [], toppings = [], onClose, onSave }) {
  const [items, setItems] = useState(
    (order.items || []).map((item) => ({
      ...item,
      _uid:     uid(),
      toppings: item.toppings || [],
    })),
  );
  const [discountCode,  setDiscountCode]  = useState(order.discount_code || '');
  const [loading,       setLoading]       = useState(false);
  const [addingProduct, setAddingProduct] = useState(null);
  const [search,        setSearch]        = useState('');

  const subtotal = items.reduce((s, item) => {
    const toppingSum = item.toppings.reduce(
      (ts, t) => ts + Number(t.price) * t.quantity,
      0,
    );
    return s + (Number(item.unit_price) + toppingSum) * item.quantity;
  }, 0);

  const handleSave = async () => {
    if (items.length === 0) { toast.error('Đơn phải có ít nhất 1 món'); return; }
    setLoading(true);
    try {
      const payload = {
        discount_code: discountCode || '',
        items: items.map((item) => ({
          product_size_id: item.product_size_id,
          quantity:        item.quantity,
          note:            item.note || '',
          toppings: item.toppings.map((t) => ({
            topping_id: t.topping_id,
            quantity:   t.quantity,
          })),
        })),
      };
      const res = await takeawayService.updateOrder(order.order_id, payload);
      onSave(res.data?.data || res.data);
      toast.success('Cập nhật đơn thành công');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi cập nhật đơn');
    } finally {
      setLoading(false);
    }
  };

  // Flatten products thành list có sizes để tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg">Sửa đơn #{order.order_id}</h3>
            <p className="text-blue-100 text-sm">
              Chỉ sửa được khi đơn đang chờ pha chế
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Cột trái — tìm & chọn thêm sản phẩm */}
          <div className="w-1/2 border-r border-gray-100 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Thêm sản phẩm
            </p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                placeholder="Tìm sản phẩm..."
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Không tìm thấy sản phẩm
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredProducts.map((p) => {
                  const minPrice = Math.min(...(p.sizes || []).map((s) => s.price));
                  const maxPrice = Math.max(...(p.sizes || []).map((s) => s.price));
                  return (
                    <button
                      key={p.id}
                      onClick={() => setAddingProduct(p)}
                      className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.sizes?.length > 0
                          ? minPrice === maxPrice
                            ? fmt(minPrice)
                            : `${fmt(minPrice)} – ${fmt(maxPrice)}`
                          : '—'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột phải — items hiện tại */}
          <div className="w-1/2 p-4 flex flex-col overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 shrink-0">
              Đơn hiện tại
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {items.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  Chưa có sản phẩm
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item._uid}
                  className="border border-gray-100 rounded-xl p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.product_name} ({item.size})
                      </p>
                      {item.toppings?.length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.toppings.map((t) => t.name).join(', ')}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-xs text-amber-600 italic truncate">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setItems((prev) =>
                          prev.filter((i) => i._uid !== item._uid),
                        )
                      }
                      className="ml-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i._uid === item._uid
                                ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                                : i,
                            ),
                          )
                        }
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i._uid === item._uid
                                ? { ...i, quantity: i.quantity + 1 }
                                : i,
                            ),
                          )
                        }
                        className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">
                      {fmt(Number(item.unit_price) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount + subtotal */}
            <div className="mt-3 shrink-0">
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  placeholder="Mã giảm giá (nếu có)"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Tạm tính</span>
                <span className="font-bold text-gray-800">{fmt(subtotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={loading || items.length === 0}
                className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested ProductModal khi chọn thêm sản phẩm */}
      {addingProduct && (
        <ProductModal
          product={addingProduct}
          toppings={toppings}
          onClose={() => setAddingProduct(null)}
          onAdd={(newItem) => {
            setItems((prev) => [
              ...prev,
              {
                ...newItem,
                product_name: newItem.productName,
                unit_price:   newItem.price,
                _uid:         uid(),
              },
            ]);
            setAddingProduct(null);
          }}
        />
      )}
    </div>
  );
}