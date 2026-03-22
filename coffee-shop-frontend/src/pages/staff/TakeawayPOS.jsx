import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingBag,
  Coffee,
  RefreshCw,
  Receipt,
  Loader2,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { ProductModal } from './TakeAwayOrder/ProductModal';
import { EditOrderModal } from './TakeAwayOrder/EditOrderModal';
import { OrderCard } from './TakeAwayOrder/OrderCard';
import { CancelModal } from './TakeAwayOrder/CancelModal';
import { ReceiptModal } from './TakeAwayOrder/ReceiptModal';
import { CheckoutModal } from './TakeAwayOrder/CheckoutModal';
import takeawayService from '@/services/takeAwayService';
import productService from '@/services/productService';
import categoryService from '@/services/categoryService';
import toppingService from '@/services/toppingService';
import productSizeService from '@/services/productSizeService';
import { toast } from 'sonner';
import QRDisplay from '../common/QRDisplay';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
const uid = () => Math.random().toString(36).slice(2, 9);

function TakeawayPOS() {
  // ─── Menu state ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // ─── Cart state ──────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false); // modal thanh toán

  // ─── Orders state ────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('active');
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // ─── Checkout state ──────────────────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null); // payos QR

  // ─── Load menu ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadMenu = async () => {
      setMenuLoading(true);
      try {
        const [productsRes, categoriesRes, toppingsRes] = await Promise.all([
          productService.getAll({ status: 'available', is_deleted: 0 }),
          categoryService.getAll({ is_deleted: 0 }),
          toppingService.getAll({ is_deleted: 0 }),
        ]);

        const rawProducts = productsRes.data?.data || productsRes.data || [];
        const rawCategories =
          categoriesRes.data?.data || categoriesRes.data || [];
        const rawToppings = toppingsRes.data?.data || toppingsRes.data || [];

        const productsWithSizes = await Promise.all(
          rawProducts.map(async (p) => {
            try {
              const sizesRes = await productSizeService.getByProduct(p.id);
              const sizes = (sizesRes.data?.data || sizesRes.data || [])
                .filter((s) => !s.is_deleted)
                .map((s) => ({
                  id: s.id,
                  size: s.size,
                  price: Number(s.price),
                }));
              const cat = rawCategories.find((c) => c.id === p.category_id);
              const thumbnail = p.images?.find((img) => img.isThumbnail === 1);
              return {
                id: p.id,
                name: p.name,
                status: p.status,
                image_url: thumbnail?.image_url || null,
                category: cat?.name || '',
                category_id: p.category_id,
                sizes,
              };
            } catch {
              return null;
            }
          }),
        );

        setProducts(
          productsWithSizes.filter(
            (p) => p && p.sizes.length > 0 && p.status === 'available',
          ),
        );
        setCategories(rawCategories.filter((c) => !c.is_deleted));
        setToppings(
          rawToppings
            .filter((t) => !t.is_deleted)
            .map((t) => ({ id: t.id, name: t.name, price: Number(t.price) })),
        );
      } catch (e) {
        toast.error('Không tải được menu');
        console.error(e);
      } finally {
        setMenuLoading(false);
      }
    };
    loadMenu();
  }, []);

  // ─── Load orders ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      // const res = await takeawayService.getOrders();
      // setOrders(res.data?.data || res.data || []);
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      toast.error('Không tải được danh sách đơn');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, item) => {
    const toppingSum = item.toppings.reduce(
      (ts, t) => ts + t.price * t.quantity,
      0,
    );
    return s + (item.price + toppingSum) * item.quantity;
  }, 0);

  const activeCount = orders.filter((o) =>
    ['pending', 'preparing', 'served'].includes(o.status),
  ).length;
  const servedCount = orders.filter((o) => o.status === 'served').length;
  const displayOrders =
    orderFilter === 'active'
      ? orders.filter((o) =>
          ['pending', 'preparing', 'served'].includes(o.status),
        )
      : orders;

  const filteredProducts = products.filter((p) => {
    const matchCat =
      activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (item) => setCart((prev) => [...prev, item]);
  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i._uid !== id));
  const updateQty = (id, delta) =>
    setCart((prev) =>
      prev.map((i) =>
        i._uid === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
      ),
    );

  // ─── Checkout (gọi từ CheckoutModal) ─────────────────────────────────────
  const handleCheckoutConfirm = async ({
    paymentMethod,
    discountCode,
    discountAmount,
  }) => {
    setCheckoutLoading(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        discount_code: discountCode || '',
        items: cart.map((item) => ({
          product_size_id: item.product_size_id,
          quantity: item.quantity,
          note: item.note || '',
          toppings: item.toppings.map((t) => ({
            topping_id: t.topping_id,
            quantity: t.quantity,
          })),
        })),
      };
      const res = await takeawayService.createOrder(payload);
      const data = res.data?.data || res.data;

      const newOrder = {
        ...data,
        items: cart.map((i) => ({
          product_name: i.productName,
          size: i.size,
          quantity: i.quantity,
          unit_price: i.price,
          note: i.note,
          toppings: i.toppings,
        })),
        discount_code: discountCode || null,
        discount_amount: discountAmount || data.discount_amount || 0,
        payment: {
          method: paymentMethod,
          status: data.is_paid ? 'paid' : 'pending',
        },
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setShowCheckout(false);

      if (paymentMethod === 'payos' && data.checkout_url) {
        setCheckoutResult(data);
      } else {
        toast.success(
          `Tạo đơn #${data.order_id} thành công · ${fmt(data.total_amount)}`,
        );
        setViewingReceipt(newOrder);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi tạo đơn');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── Cancel ───────────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelingOrder) return;
    setCancelLoading(true);
    try {
      const res = await takeawayService.cancelOrder(
        cancelingOrder.order_id || cancelingOrder.id,
      );
      const data = res.data?.data || res.data;
      setOrders((prev) =>
        prev.map((o) =>
          (o.order_id || o.id) ===
          (cancelingOrder.order_id || cancelingOrder.id)
            ? { ...o, status: 'cancelled' }
            : o,
        ),
      );
      if (data?.refund) toast.success(data.refund.message);
      else toast.success('Hủy đơn thành công');
      setCancelingOrder(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi hủy đơn');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleComplete = async (order) => {
    try {
      await takeawayService.markCompleted(order.order_id || order.id);
      setOrders((prev) =>
        prev.map((o) =>
          (o.order_id || o.id) === (order.order_id || order.id)
            ? { ...o, status: 'completed' }
            : o,
        ),
      );
      toast.success(`Đơn #${order.order_id || order.id} đã giao cho khách`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleEditSave = (updatedData) => {
    setOrders((prev) =>
      prev.map((o) =>
        (o.order_id || o.id) === (editingOrder.order_id || editingOrder.id)
          ? { ...o, ...updatedData }
          : o,
      ),
    );
    setEditingOrder(null);
  };

  // ─── Keyboard: Enter để mở modal thanh toán ──────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !showCheckout && cart.length > 0) {
        setShowCheckout(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCheckout, cart.length]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className='flex h-full gap-0 -m-4 md:-m-8 -mt-2'>
      {/* ════ CỘT TRÁI — Menu ════ */}
      <div className='flex flex-col w-0 flex-[5] min-w-0 border-r border-gray-100'>
        <div className='px-5 pt-5 pb-3 border-b border-gray-100 shrink-0'>
          <div className='flex items-center gap-2 mb-3'>
            <ShoppingBag size={20} className='text-amber-500' />
            <h2 className='font-bold text-gray-800 text-lg'>Đặt đồ mang đi</h2>
          </div>
          <div className='relative'>
            <Search
              size={15}
              className='absolute left-3 top-2.5 text-gray-400'
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm tên sản phẩm...'
              className='w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-gray-50'
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className='flex gap-2 px-5 py-3 overflow-x-auto shrink-0 scrollbar-none'>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className='flex-1 overflow-y-auto px-5 pb-5'>
          {menuLoading ? (
            <div className='flex items-center justify-center h-full'>
              <Loader2 size={28} className='animate-spin text-amber-400' />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-300 gap-2'>
              <Coffee size={40} />
              <p className='text-sm'>Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className='group bg-white rounded-2xl border-2 border-gray-100 p-3.5 text-left hover:border-amber-300 hover:shadow-md transition-all active:scale-95'
                >
                  <div className='w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3'>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-all'>
                        <Coffee size={28} className='text-amber-400' />
                      </div>
                    )}
                  </div>
                  <p className='text-sm font-semibold text-gray-800 line-clamp-2 leading-tight'>
                    {p.name}
                  </p>
                  <p className='text-xs text-amber-600 font-medium mt-1'>
                    {fmt(p.sizes[0].price)}
                  </p>
                  <div className='mt-2 w-full py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-all'>
                    Chọn
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════ CỘT GIỮA — Giỏ hàng ════ */}
      <div className='flex flex-col w-0 flex-[3] min-w-0 border-r border-gray-100 bg-gray-50'>
        <div className='px-4 pt-5 pb-3 border-b border-gray-100 bg-white shrink-0'>
          <h3 className='font-bold text-gray-800 flex items-center gap-2'>
            <ShoppingBag size={16} className='text-amber-500' />
            Giỏ hàng
            {cart.length > 0 && (
              <span className='ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full'>
                {cart.length}
              </span>
            )}
          </h3>
        </div>

        {/* Items */}
        <div className='flex-1 overflow-y-auto p-4 space-y-2 min-h-0'>
          {cart.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-300 gap-3'>
              <ShoppingBag size={40} />
              <p className='text-sm'>Chưa có món nào</p>
              <p className='text-xs text-center'>
                Chọn sản phẩm từ menu bên trái
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._uid}
                className='bg-white rounded-xl p-3 border border-gray-100 shadow-sm'
              >
                <div className='flex justify-between items-start gap-2'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-800 truncate'>
                      {item.productName}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Size {item.size} · {fmt(item.price)}
                    </p>
                    {item.toppings.length > 0 && (
                      <p className='text-xs text-amber-600 truncate'>
                        +
                        {item.toppings
                          .map((t) => `${t.name}×${t.quantity}`)
                          .join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className='text-xs text-gray-400 italic truncate'>
                        "{item.note}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item._uid)}
                    className='w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 shrink-0'
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className='flex items-center justify-between mt-2.5'>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => updateQty(item._uid, -1)}
                      className='w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 text-gray-600'
                    >
                      <Minus size={12} />
                    </button>
                    <span className='text-sm font-bold w-5 text-center'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item._uid, 1)}
                      className='w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600'
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className='text-sm font-bold text-amber-600'>
                    {fmt(
                      (item.price +
                        item.toppings.reduce(
                          (s, t) => s + t.price * t.quantity,
                          0,
                        )) *
                        item.quantity,
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Tổng + nút Thanh toán ── */}
        <div className='p-4 border-t border-gray-200 bg-white shrink-0 space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-500'>Tạm tính</span>
            <span className='font-bold text-gray-800 text-base'>
              {fmt(subtotal)}
            </span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className='w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200'
          >
            <Banknote size={16} /> Thanh toán · {fmt(subtotal)}
          </button>
        </div>
      </div>

      {/* ════ CỘT PHẢI — Đơn mang đi ════ */}
      <div className='flex flex-col w-0 flex-[3] min-w-0'>
        <div className='px-4 pt-5 pb-3 border-b border-gray-100 shrink-0'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-bold text-gray-800 flex items-center gap-2'>
              <Receipt size={16} className='text-amber-500' />
              Đơn mang đi
              {servedCount > 0 && (
                <span className='ml-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse font-semibold'>
                  {servedCount} sẵn sàng
                </span>
              )}
            </h3>
            <button
              onClick={loadOrders}
              className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              title='Làm mới'
            >
              <RefreshCw
                size={14}
                className={ordersLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>
          <div className='flex bg-gray-100 rounded-xl p-1 gap-1'>
            <button
              onClick={() => setOrderFilter('active')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${orderFilter === 'active' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              Đang xử lý{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            <button
              onClick={() => setOrderFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${orderFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              Tất cả ({orders.length})
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0'>
          {ordersLoading ? (
            <div className='flex items-center justify-center h-full'>
              <Loader2 size={24} className='animate-spin text-gray-300' />
            </div>
          ) : displayOrders.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-300 gap-3'>
              <Coffee size={40} />
              <p className='text-sm'>Chưa có đơn nào</p>
            </div>
          ) : (
            displayOrders.map((order) => (
              <OrderCard
                key={order.order_id || order.id}
                order={order}
                onEdit={setEditingOrder}
                onCancel={setCancelingOrder}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>
      </div>

      {/* ════ MODALS ════ */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          subtotal={subtotal}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckoutConfirm}
          loading={checkoutLoading}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          products={products}
          toppings={toppings}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSave}
        />
      )}

      {cancelingOrder && (
        <CancelModal
          order={cancelingOrder}
          onClose={() => setCancelingOrder(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
        />
      )}

      {viewingReceipt && (
        <ReceiptModal
          order={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      {/* PayOS QR */}
      {checkoutResult && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95'>
            <div className='w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4'>
              <CreditCard size={28} className='text-blue-600' />
            </div>

            <h3 className='font-bold text-lg text-gray-800'>
              Quét QR để thanh toán
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              Đơn #{checkoutResult.order_id} ·{' '}
              {fmt(checkoutResult.total_amount)}
            </p>

            {/* ── QR generate từ checkoutUrl ── */}
            <div className='mt-4 flex flex-col items-center gap-2'>
              <QRDisplay
                url={checkoutResult.checkout_url}
                qrString={checkoutResult.qr_code} 
              />
              <p className='text-xs text-gray-400'>
                Quét bằng app ngân hàng bất kỳ
              </p>
            </div>

            {/* Link fallback nếu không quét được */}
            <a
              href={checkoutResult.checkout_url}
              target='_blank'
              rel='noreferrer'
              className='mt-2 text-xs text-blue-500 hover:underline block'
            >
              Hoặc mở link thanh toán →
            </a>

            <p className='text-xs text-gray-400 mt-3'>
              Sau khi khách thanh toán, đơn sẽ tự động cập nhật
            </p>
            <button
              onClick={() => setCheckoutResult(null)}
              className='w-full mt-4 py-2.5 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-gray-900'
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TakeawayPOS;
