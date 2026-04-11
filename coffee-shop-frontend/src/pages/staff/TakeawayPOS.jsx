import { useState, useEffect, useCallback } from 'react';
import {
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
import { ProductGrid } from './TakeAwayOrder/ProductGrid';
import { ProductModal } from './TakeAwayOrder/ProductModal';
import { EditOrderModal } from './TakeAwayOrder/EditOrderModal';
import { OrderCard } from './TakeAwayOrder/OrderCard';
import { CancelModal } from './TakeAwayOrder/CancelModal';
import { PrintableReceipt } from './PrintableReceipt';
import { CheckoutModal } from './TakeAwayOrder/CheckoutModal';
import takeawayService from '@/services/takeAwayService';
import categoryService from '@/services/categoryService';
import toppingService from '@/services/toppingService';
import productService from '@/services/productService';
import { toast } from 'sonner';
import QRDisplay from '../common/QRDisplay';
import socket from '@/lib/socket';
import authenticationService from '@/services/authenticationService';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

function TakeawayPOS() {
  // ─── Menu state ───────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // ─── Cart state ───────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // ─── Orders state ─────────────────────────────────────────────────────────
  const [_orders, setOrders] = useState([]);
  const [_ordersLoading, setOrdersLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [_cancelLoading, setCancelLoading] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // ─── Checkout state ───────────────────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [printerName, setPrinterName] = useState('Nhân viên');

  // ─── Load categories + toppings ───────────────────────────────────────────
  useEffect(() => {
    const loadMeta = async () => {
      setMetaLoading(true);
      try {
        const [categoriesRes, toppingsRes, productsRes] = await Promise.all([
          categoryService.getAll({ is_deleted: 0 }),
          toppingService.getAll({ is_deleted: 0 }),
          productService.getAll({ status: 'available', is_deleted: 0, limit: 500 }),
        ]);
        const rawCategories =
          categoriesRes.data?.data || categoriesRes.data || [];
        const rawToppings = toppingsRes.data?.data || toppingsRes.data || [];

        // Lấy tập category_id có ít nhất 1 sản phẩm available
        const rawProducts = productsRes?.data || [];
        const nonEmptyCategoryIds = new Set(
          rawProducts
            .filter((p) => p.status === 'available' && (p.sizes || []).filter((s) => !s.is_deleted).length > 0)
            .map((p) => p.category_id)
        );

        setCategories(rawCategories.filter((c) => !c.is_deleted && nonEmptyCategoryIds.has(c.id)));
        setToppings(
          rawToppings
            .filter((t) => !t.is_deleted || t.is_deleted === 0 || t.is_deleted === '0')
            .map((t) => ({ id: t.id, name: t.name, price: Number(t.price) })),
        );
      } catch (e) {
        toast.error('Không tải được danh mục');
        console.error(e);
      } finally {
        setMetaLoading(false);
      }
    };
    loadMeta();

    // Load printer profile
    const loadProfile = async () => {
      try {
        const res = await authenticationService.getProfile();
        const user = res?.data?.id ? res.data : res?.data?.data || res?.data;
        const firstName = String(user?.first_name || '').trim();
        const lastName = String(user?.last_name || '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        setPrinterName(fullName || user?.username || user?.email || 'Nhân viên');
      } catch {
        // Ignore
      }
    };
    loadProfile();
  }, []);

  // ─── Load orders ──────────────────────────────────────────────────────────
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

  const openReceiptFromOrder = useCallback(
    async (orderSeed) => {
      const orderId = Number(orderSeed?.order_id || orderSeed?.id || 0);
      if (!orderId) {
        toast.error('Không xác định được đơn để in hóa đơn');
        return;
      }

      try {
        toast.info('Đang lấy dữ liệu hóa đơn...');
        const res = await takeawayService.getReceipt(orderId);
        const receipt = res?.data?.receipt;

        if (!receipt) {
          throw new Error('Receipt data is empty');
        }

        setViewingReceipt({
          ...orderSeed,
          ...receipt,
          amount: Math.max(
            0,
            Number(
              receipt?.amount ??
                receipt?.subtotal_amount ??
                orderSeed?.amount ??
                orderSeed?.subtotal_amount ??
                0,
            ),
          ),
          printed_by: printerName,
          autoPrint: true,
        });
      } catch (error) {
        console.error('Lỗi lấy dữ liệu hóa đơn:', error);
        toast.error('Không thể lấy dữ liệu in hóa đơn');
      }
    },
    [printerName],
  );

  // ─── Socket listener PayOS ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handlePaymentCompleted = async (data) => {
      const orderId = data.order_id;
      // Socket event handler is no longer primarily used to render the receipt for PayOS
      // because we redirect the page, but we keep it here just in case another client completes it.
      if (
        orderId &&
        checkoutResult &&
        (checkoutResult.order_id === orderId || checkoutResult.id === orderId)
      ) {
        toast.success(`Thanh toán PayOS thành công cho đơn #${orderId}!`);
        await openReceiptFromOrder({
          ...checkoutResult,
          order_id: checkoutResult.order_id || checkoutResult.id,
        });
        setCheckoutResult(null);
      }
    };

    socket.on('order:payment-completed', handlePaymentCompleted);
    return () => socket.off('order:payment-completed', handlePaymentCompleted);
  }, [checkoutResult, openReceiptFromOrder]);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, item) => {
    const toppingSum = item.toppings.reduce(
      (ts, t) => ts + t.price * t.quantity,
      0,
    );
    return s + (item.price + toppingSum) * item.quantity;
  }, 0);

  // const activeCount = orders.filter((o) =>
  //   ['pending', 'preparing', 'served'].includes(o.status),
  // ).length;
  // const servedCount = orders.filter((o) => o.status === 'served').length;
  // const displayOrders =
  //   orderFilter === 'active'
  //     ? orders.filter((o) =>
  //         ['pending', 'preparing', 'served'].includes(o.status),
  //       )
  //     : orders;

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

  // ─── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckoutConfirm = async ({
    paymentMethod,
    discountCode,
    discountAmount,
    receivedAmount,
  }) => {
    setCheckoutLoading(true);
    try {
      const returnUrl = `${window.location.origin}/staff/payment-result?origin=${encodeURIComponent(window.location.pathname)}`;
      const payload = {
        payment_method: paymentMethod,
        is_paid: paymentMethod === 'cash' ? 1 : 0,
        discount_code: discountCode || '',
        returnUrl,
        cancelUrl: returnUrl,
        cash_received: paymentMethod === 'cash' ? receivedAmount || 0 : 0,
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
        amount: Math.max(
          0,
          Number(data?.amount ?? data?.subtotal_amount ?? subtotal),
        ),
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
        is_paid: paymentMethod === 'cash' ? 1 : data.is_paid ? 1 : 0,
        payment: {
          method: paymentMethod,
          status:
            paymentMethod === 'cash' ? 'paid' : data.is_paid ? 'paid' : 'pending',
        },
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setShowCheckout(false);

      if (paymentMethod === 'payos' && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.success(
          `Tạo đơn #${data.order_id} thành công · ${fmt(data.total_amount)}`,
        );
        await openReceiptFromOrder(newOrder);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi tạo đơn');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── Cancel ───────────────────────────────────────────────────────────────
  const _handleCancelConfirm = async () => {
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

  const _handleEditSave = (updatedData) => {
    setOrders((prev) =>
      prev.map((o) =>
        (o.order_id || o.id) === (editingOrder.order_id || editingOrder.id)
          ? { ...o, ...updatedData }
          : o,
      ),
    );
    setEditingOrder(null);
  };

  // ─── Enter mở modal thanh toán ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !showCheckout && cart.length > 0)
        setShowCheckout(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCheckout, cart.length]);

  return (
    <div className='flex h-full gap-0 bg-white dark:bg-gray-900'>
      {/*  CỘT TRÁI — Menu */}
      <div className='flex flex-col w-0 flex-[5] min-w-0 border-r border-gray-100 dark:border-gray-800'>
        {/* Header */}
        <div className='px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0'>
          <div className='flex items-center gap-2'>
            <h2 className='font-bold text-gray-800 dark:text-gray-200 text-lg'>Đặt đồ mang đi</h2>
          </div>
        </div>

        {/* Category tabs */}
        <div className='flex gap-2 px-5 py-3 overflow-x-auto shrink-0 scrollbar-none border-b border-gray-100 dark:border-gray-800'>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-white shadow-sm dark:shadow-none'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Tất cả
          </button>
          {metaLoading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='h-7 w-16 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0'
                />
              ))
            : categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-sm dark:shadow-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
        </div>

        {/* ProductGrid — tự quản lý fetch + phân trang */}
        <div className='flex-1 min-h-0'>
          <ProductGrid
            activeCategory={activeCategory}
            onSelectProduct={setSelectedProduct}
          />
        </div>
      </div>

      {/*  CỘT GIỮA — Giỏ hàng */}
      <div className='flex flex-col w-0 flex-[3] min-w-0 min-h-0 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'>
        <div className='px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0'>
          <h3 className='font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2'>
            <ShoppingBag size={16} className='text-amber-500' />
            Giỏ hàng
            {cart.length > 0 && (
              <span className='ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full'>
                {cart.length}
              </span>
            )}
          </h3>
        </div>

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
                className='bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none'
              >
                <div className='flex justify-between items-start gap-2'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-800 dark:text-gray-200 truncate'>
                      {item.productName}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Size {item.size} · {fmt(item.price)}
                    </p>
                    {item.toppings.length > 0 && (
                      <p className='text-xs text-amber-600 dark:text-amber-400 truncate'>
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
                    className='w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/30 text-red-400 flex items-center justify-center hover:bg-red-100 dark:bg-red-900/40 shrink-0'
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className='flex items-center justify-between mt-2.5'>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => updateQty(item._uid, -1)}
                      className='w-7 h-7 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
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
                  <span className='text-sm font-bold text-amber-600 dark:text-amber-400'>
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

        <div className='p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-500 dark:text-gray-400'>Tạm tính</span>
            <span className='font-bold text-gray-800 dark:text-gray-200 text-base'>
              {fmt(subtotal)}
            </span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className='w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none shadow-amber-200'
          >
            <Banknote size={16} /> Thanh toán · {fmt(subtotal)}
          </button>
        </div>
      </div>

      {/*  MODALS  */}
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

      {/* {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          toppings={toppings}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSave}
        />
      )} */}

      {/* {cancelingOrder && (
        <CancelModal
          order={cancelingOrder}
          onClose={() => setCancelingOrder(null)}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
        />
      )} */}

      {viewingReceipt && (
        <PrintableReceipt
          order={viewingReceipt}
          onDone={() => setViewingReceipt(null)}
        />
      )}

      {/* PayOS QR */}
      {/* {checkoutResult && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95'>
            <div className='w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4'>
              <CreditCard size={28} className='text-blue-600 dark:text-blue-400' />
            </div>
            <h3 className='font-bold text-lg text-gray-800 dark:text-gray-200'>
              Quét QR để thanh toán
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Đơn #{checkoutResult.order_id} ·{' '}
              {fmt(checkoutResult.total_amount)}
            </p>
            <div className='mt-4 flex flex-col items-center gap-2'>
              <QRDisplay
                url={checkoutResult.checkout_url}
                qrString={checkoutResult.qr_code}
              />
              <p className='text-xs text-gray-400'>
                Quét bằng app ngân hàng bất kỳ
              </p>
            </div>
            <a
              href={checkoutResult.checkout_url}
              target='_blank'
              rel='noreferrer'
              className='mt-2 text-xs text-blue-500 dark:text-blue-400 hover:underline block'
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
      )} */}
    </div>
  );
}

export default TakeawayPOS;
