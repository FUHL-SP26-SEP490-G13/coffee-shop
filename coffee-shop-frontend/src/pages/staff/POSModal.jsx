import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Plus, Minus, Trash2, ShoppingCart, Coffee, Send } from 'lucide-react';
import productService from '../../services/productService';
import tableService from '../../services/tableService';
import orderService from '../../services/orderService';
import categoryService from '../../services/categoryService';
import toppingService from '../../services/toppingService';
import discountService from '../../services/discountService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { ProductModal } from './TakeAwayOrder/ProductModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const getProductPrice = (product, size = 'M') => {
  const sizeItem = product.sizes?.find((s) => s.size === size);
  return sizeItem ? Number(sizeItem.price) : 0;
};

const getProductImage = (product) => {
  const thumbnail = product.images?.find((img) => img.isThumbnail === 1) || product.images?.[0];
  return thumbnail ? thumbnail.image_url : null;
};

const CASH_SUGGESTIONS = [10000, 20000, 50000, 100000, 200000, 500000];

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const TABLE_MANAGEMENT_PATH = '/staff/tables';

export function POSModal({ isOpen, onClose, table, onTableStatusChange }) {
  const [editingCartItem, setEditingCartItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [note, setNote] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customerCash, setCustomerCash] = useState(0);
  const [discountError, setDiscountError] = useState('');
<<<<<<< Updated upstream
=======
  const [pendingPayosOrderId, setPendingPayosOrderId] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [printerName, setPrinterName] = useState('Nhân viên');
  const [sendingToBarista, setSendingToBarista] = useState(false);
>>>>>>> Stashed changes

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes, toppingsRes] = await Promise.all([
          productService.getAll({ limit: 100 }),
          categoryService.getAll({ is_deleted: 0 }),
          toppingService.getAll({ is_deleted: 0 }),
        ]);
        setProducts(productsRes.data || []);
        const cats = categoriesRes.data?.data || categoriesRes.data || [];
        setCategories(cats.filter((c) => !c.is_deleted));
        const rawToppings = toppingsRes.data?.data || toppingsRes.data || [];
        setToppings(
          rawToppings
            .filter((t) => !t.is_deleted)
            .map((t) => ({ id: t.id, name: t.name, price: Number(t.price) }))
        );
      } catch {
        toast.error('Không tải được dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  // Reset cart khi đổi bàn
  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setNote('');
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isOpen, table?.id]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.size === 'M');
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          product,
          size: 'M',
          quantity: 1,
          toppings: [],
        },
      ];
    });
  }, []);

  const handleAddFromModal = (modalItem, isEditing = false) => {
    setCart((prev) => {
      if (isEditing) {
        return prev.map((item) =>
          item.id === modalItem._uid
            ? {
              ...item,
              productId: modalItem.product_size_id,
              originalProductId: modalItem.product_id,
              size: modalItem.size,
              price: Number(modalItem.price),
              toppings: (modalItem.toppings || []).map((t) => ({ ...t, price: Number(t.price) })),
              note: modalItem.note,
            }
            : item
        );
      }
      return [
        ...prev,
        {
          id: modalItem._uid,
          productId: modalItem.product_size_id,
          originalProductId: modalItem.product_id,
          product: { name: modalItem.productName },
          size: modalItem.size,
          price: Number(modalItem.price),
          toppings: (modalItem.toppings || []).map((t) => ({ ...t, price: Number(t.price) })),
          note: modalItem.note,
          quantity: 1,
        },
      ];
    });
    if (isEditing) setEditingCartItem(null);
  };

  const updateQuantity = useCallback((id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const total = cart.reduce((acc, item) => {
    const basePrice = Number(item.price || getProductPrice(item.product, item.size) || 0);
    const toppingTotal = (item.toppings || []).reduce(
      (s, t) => s + Number(t.price || 0) * (t.quantity || 1),
      0
    );
    return acc + (basePrice + toppingTotal) * item.quantity;
  }, 0);

  const handleOpenPaymentModal = () => {
    if (!table) {
      toast.error('Không tìm thấy thông tin bàn');
      return;
    }
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    setDiscountAmount(0);
    setDiscountCode('');
    setDiscountError('');
    setCustomerCash(total);
    setPaymentMethod('cash');
    setIsPaymentModalOpen(true);
  };

  const buildOrderItemsPayload = () => {
    const items = cart.map((item) => {
      const productSizeId = item.price
        ? item.productId
        : item.product.sizes?.find((s) => s.size === item.size)?.id;
      return {
        product_size_id: productSizeId,
        quantity: item.quantity,
        toppings: (item.toppings || []).map((t) => ({
          topping_id: t.topping_id || t.id,
          quantity: t.quantity || 1,
        })),
      };
    });

    if (items.some((i) => !i.product_size_id)) {
      throw new Error('invalid-product-size');
    }

    return items;
  };

  const createUnpaidOrder = async () => {
    const items = buildOrderItemsPayload();
    const payload = {
      order_type: 'dine-in',
      table_id: Number(table.id),
      payment_method: 'payos',
      receiver_name: `Khách Bàn ${table.code || ''}`,
      receiver_phone: '0000000000',
      items,
      note: note.trim() || undefined,
      discount_code: discountAmount > 0 ? discountCode : undefined,
    };
    return orderService.checkout(payload);
  };

  const handleSendToBarista = async () => {
    if (!table) {
      toast.error('Không tìm thấy thông tin bàn');
      return;
    }
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    setSendingToBarista(true);
    try {
      await createUnpaidOrder();

      // Placeholder for future Barista-account handoff integration.
      const handoffToBaristaAccount = () => {
        return true;
      };
      handoffToBaristaAccount();

      toast.success('Đã gửi order cho Barista! 🎉', {
        description: `Bàn ${table.code} — ${cart.reduce((a, i) => a + i.quantity, 0)} món`,
      });
      if (onTableStatusChange) onTableStatusChange(table.id, 'occupied');
      setCart([]);
      setNote('');
      navigate(TABLE_MANAGEMENT_PATH, {
        state: {
          focusTableId: table.id,
          sourceAction: 'send-barista',
        },
      });
      onClose();
    } catch (error) {
      if (error?.message === 'invalid-product-size') {
        toast.error('Có lỗi xảy ra với thông tin sản phẩm');
        return;
      }
      toast.error(error.response?.data?.message || 'Không gửi được order cho Barista');
    } finally {
      setSendingToBarista(false);
    }
  };

  const handleSaveForLaterPayment = async () => {
    if (!table) {
      toast.error('Không tìm thấy thông tin bàn');
      return;
    }
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    try {
      await createUnpaidOrder();
      toast.success('Đã lưu đơn chờ thanh toán');
      setCart([]);
      setNote('');
      if (onTableStatusChange) onTableStatusChange(table.id, 'occupied');
      navigate(TABLE_MANAGEMENT_PATH, {
        state: {
          focusTableId: table.id,
          sourceAction: 'save-for-later',
        },
      });
      onClose();
    } catch (error) {
      if (error?.message === 'invalid-product-size') {
        toast.error('Có lỗi xảy ra với thông tin sản phẩm');
        return;
      }
      toast.error(error.response?.data?.message || 'Không lưu được đơn chờ thanh toán');
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    setDiscountError('');
    try {
      const discount = await discountService.getByCode(discountCode.trim());
      if (!discount || discount.deleted_at) {
        setDiscountError('Mã giảm giá không tồn tại');
        return;
      }
      const now = new Date();
      if (discount.valid_from && now < new Date(discount.valid_from)) {
        setDiscountError('Mã giảm giá chưa đến thời gian sử dụng');
        return;
      }
      if (discount.valid_until && now > new Date(discount.valid_until)) {
        setDiscountError('Mã giảm giá đã hết hạn');
        return;
      }
      const usageLimit = discount.usage_limit == null ? null : Number(discount.usage_limit);
      const usedCount = Number(discount.used_count || 0);
      if (usageLimit !== null && usedCount >= usageLimit) {
        setDiscountError('Mã giảm giá đã hết lượt sử dụng');
        return;
      }
      const minOrder = Number(discount.min_order_amount || 0);
      if (total < minOrder) {
        setDiscountError(`Đơn tối thiểu ${formatVND(minOrder)} để dùng mã này`);
        return;
      }
      const percentage = Number(discount.percentage || 0);
      let amount = Math.round((total * percentage) / 100);
      const maxDiscount =
        discount.max_discount_amount == null ? null : Number(discount.max_discount_amount);
      if (maxDiscount !== null) amount = Math.min(amount, maxDiscount);
      amount = Math.min(total, Math.max(0, amount));
      setDiscountAmount(amount);
      setCustomerCash(total - amount);
      setDiscountError('');
      toast.success('Áp dụng mã giảm giá thành công');
    } catch (error) {
      setDiscountError(error.response?.data?.message || 'Không áp dụng được mã');
      setDiscountAmount(0);
      setCustomerCash(total);
    }
  };

  const handleConfirmPayment = async () => {
    const finalTotal = Math.max(0, total - discountAmount);
    if (paymentMethod === 'cash' && customerCash < finalTotal) {
      toast.error('Tiền khách đưa không đủ');
      return;
    }
    try {
      const items = buildOrderItemsPayload();
      const payload = {
        order_type: 'dine-in',
        table_id: Number(table.id),
        payment_method: paymentMethod,
        receiver_name: `Khách Bàn ${table.code || ''}`,
        receiver_phone: '0000000000',
        items,
        note: note.trim() || undefined,
        discount_code: discountAmount > 0 ? discountCode : undefined,
      };
      const res = await orderService.checkout(payload);
      if (paymentMethod === 'payos') {
        const orderId = res.data?.order_id || res.data?.id;
        if (orderId) {
          const payosItems = cart.map((item) => ({
            name: `${item.productName || item.product?.name || 'Sản phẩm'}${item.size ? ` - ${item.size}` : ''
              }`.slice(0, 100),
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
          }));
          const createRes = await orderService.createPaymentLink({
            orderCode: Number(orderId),
            amount: Number(finalTotal),
            description: `DH${orderId}`.slice(0, 25),
            items: payosItems,
          });
          if (createRes.data?.checkoutUrl) {
            window.open(createRes.data.checkoutUrl, '_blank');
          } else {
            toast.error('Không tạo được link thanh toán QR');
          }
        }
<<<<<<< Updated upstream
=======
      } else {
        setPendingPayosOrderId(null);
        const orderId = res.data?.order_id || res.data?.id;
        if (orderId && paymentMethod === 'cash') {
          const resData = res.data?.data || res.data;
          const orderData = {
            ...resData,
            order_id: orderId,
            order_code: `DH-${String(orderId).padStart(6, '0')}`,
            order_type: resData.order_type || 'dine-in',
            receiver_name: `Khách Bàn ${table?.code || ''}`,
            receiver_phone: '0000000000',
            printed_by: printerName,
            items: cart.map((item) => ({
              product_name: item.productName || item.product?.name || 'Sản phẩm',
              size: item.size || 'M',
              quantity: item.quantity,
              unit_price: item.price || item.product?.price || 0,
              toppings: item.toppings || [],
              note: item.note || '',
            })),
            discount_code: discountAmount > 0 ? discountCode : null,
            discount_amount: discountAmount || resData.discount_amount || 0,
            total_amount: resData.total_amount || finalTotal,
            is_paid: paymentMethod === 'cash' ? 1 : (resData.is_paid ? 1 : 0),
            payment: {
              method: paymentMethod,
              status: paymentMethod === 'cash' ? 'paid' : (resData.is_paid ? 'paid' : 'pending'),
            },
          };
          setViewingReceipt({ ...orderData, autoPrint: true });
        }
>>>>>>> Stashed changes
      }
      toast.success('Đặt hàng thành công!');
      setCart([]);
      setNote('');
      setIsPaymentModalOpen(false);
      // Cập nhật trạng thái bàn về "occupied" nếu cần
      if (onTableStatusChange) onTableStatusChange(table.id, 'occupied');
<<<<<<< Updated upstream
      onClose();
    } catch (error) {
=======

      if (paymentMethod !== 'cash') {
        navigate(TABLE_MANAGEMENT_PATH, {
          state: {
            focusTableId: table.id,
            sourceAction: 'payos-payment',
          },
        });
        onClose();
      }
    } catch (error) {
      if (error?.message === 'invalid-product-size') {
        toast.error('Có lỗi xảy ra với thông tin sản phẩm');
        return;
      }
      if (paymentMethod === 'payos') {
        setPendingPayosOrderId(null);
      }
>>>>>>> Stashed changes
      toast.error(error.response?.data?.message || 'Không đặt được hàng');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const suggestions = useMemo(() => {
    const finalAmount = Math.max(0, total - discountAmount);
    const base = [finalAmount, ...CASH_SUGGESTIONS.filter((v) => v > finalAmount)];
    const roundUp = Math.ceil(finalAmount / 10000) * 10000;
    if (!base.includes(roundUp)) base.splice(1, 0, roundUp);
    return [...new Set(base)].slice(0, 4);
  }, [total, discountAmount]);

  const statusColor =
    table?.status === 'available'
      ? 'from-green-500 to-emerald-600'
      : table?.status === 'occupied'
        ? 'from-blue-500 to-blue-700'
        : 'from-amber-500 to-amber-600';

  if (!isOpen) return null;

  return (
    <>
      {/* Fullscreen POS Overlay */}
      <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
        {/* Top Bar */}
        <div
          className={`bg-gradient-to-r ${statusColor} text-white px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                Bàn {table?.code}
              </h2>
              <p className="text-white/80 text-xs">{table?.area_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-medium">
              {cart.length > 0 ? `${cart.reduce((a, i) => a + i.quantity, 0)} món` : 'Chưa chọn món'}
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Product Catalog */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
            {/* Search + Categories */}
            <div className="p-4 pb-0 flex-shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === 'all'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Đang tải sản phẩm...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Không tìm thấy sản phẩm
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="group bg-card rounded-xl p-2 border border-border hover:border-amber-400/60 hover:shadow-md transition-all text-left relative overflow-hidden"
                    >
                      <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                        {getProductImage(product) ? (
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Coffee className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold line-clamp-2 leading-tight mb-1 text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-600">
                        {formatVND(getProductPrice(product, 'M'))}
                      </p>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart Panel */}
          <div className="w-80 xl:w-96 flex flex-col bg-card flex-shrink-0">
            {/* Cart Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Giỏ hàng</span>
              {cart.length > 0 && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">
                  {cart.reduce((a, i) => a + i.quantity, 0)} món
                </span>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <ShoppingCart className="w-12 h-12 opacity-20" />
                  <p className="text-sm text-center">
                    Chọn sản phẩm để thêm vào giỏ
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setEditingCartItem(item)}
                      className="bg-background rounded-xl p-3 border border-border hover:border-amber-300 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-sm font-semibold line-clamp-1 flex-1 text-foreground">
                          {item.productName || item.product?.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCart((prev) => prev.filter((i) => i.id !== item.id));
                          }}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
                          {item.size}
                        </span>
                        {item.toppings?.length > 0 && (
                          <span className="text-amber-600 truncate">
                            +{item.toppings.map((t) => t.name).join(', ')}
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1 mb-1.5">
                          "{item.note}"
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, -1);
                            }}
                            className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 1);
                            }}
                            className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-amber-600">
                          {formatVND(
                            (Number(item.price || getProductPrice(item.product, item.size) || 0) +
                              (item.toppings || []).reduce(
                                (s, t) => s + Number(t.price || 0) * (t.quantity || 1),
                                0
                              )) *
                            item.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="px-3 pb-2 flex-shrink-0">
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Ghi chú đơn hàng
              </label>
              <Textarea
                placeholder="Ví dụ: Ít đá, không đường..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs resize-none bg-background"
                rows={2}
              />
            </div>

            {/* Total + Checkout */}
            <div className="p-3 border-t border-border flex-shrink-0 space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm text-muted-foreground">Tổng cộng</span>
                <span className="text-xl font-black text-amber-600">{formatVND(total)}</span>
              </div>

              {/* Send to Barista */}
              <Button
                onClick={handleSendToBarista}
                disabled={cart.length === 0 || sendingToBarista}
                className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm gap-2 shadow-sm transition-all active:scale-95"
              >
                {sendingToBarista ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi Barista
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleOpenPaymentModal}
                  disabled={cart.length === 0}
                  className="h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm gap-2 shadow-sm transition-all active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thanh toán
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveForLaterPayment}
                  disabled={cart.length === 0}
                  className="h-11 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold"
                >
                  Trả sau
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddFromModal}
        />
      )}
      {editingCartItem && (
        <ProductModal
          product={
            products.find((p) => p.id === editingCartItem.originalProductId) ||
            editingCartItem.product || {
              name: editingCartItem.productName || 'Sản phẩm',
              sizes: [],
            }
          }
          toppings={toppings}
          initialItem={editingCartItem}
          onClose={() => setEditingCartItem(null)}
          onAdd={(item) => handleAddFromModal(item, true)}
        />
      )}

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md p-6 z-[60]">
          <DialogHeader>
            <DialogTitle className="text-gray-800 text-lg font-bold">
              Thanh toán — Bàn {table?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tổng tiền hàng</span>
                <span>{formatVND(total)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-500 text-sm">
                  <span>Mã giảm giá</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-dashed">
                <span>Khách cần trả</span>
                <span className="text-orange-500">
                  {formatVND(Math.max(0, total - discountAmount))}
                </span>
              </div>
            </div>

            {/* Discount Code */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">MÃ GIẢM GIÁ</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                />
                <Button
                  onClick={handleApplyDiscount}
                  className="bg-orange-100 text-orange-500 hover:bg-orange-200 border-none px-4"
                >
                  Áp dụng
                </Button>
              </div>
              {discountError && <p className="text-red-500 text-xs mt-1">{discountError}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">
                PHƯƠNG THỨC THANH TOÁN
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${paymentMethod === 'cash'
                    ? 'border-green-500 text-green-600 bg-green-50/50'
                    : 'border-gray-200 text-gray-600'
                    }`}
                >
                  <span className="text-lg">💵</span> Tiền mặt
                </button>
                <button
                  onClick={() => setPaymentMethod('payos')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${paymentMethod === 'payos'
                    ? 'border-green-500 text-green-600 bg-green-50/50'
                    : 'border-gray-200 text-gray-600'
                    }`}
                >
                  <span className="text-lg">💳</span> QR PayOS
                </button>
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">
                    TIỀN KHÁCH ĐƯA
                  </label>
                  <Input
                    type="number"
                    value={customerCash || ''}
                    onChange={(e) => setCustomerCash(Number(e.target.value))}
                    className="bg-gray-50 border-gray-200 text-lg font-bold"
                  />
                </div>
                <div className="flex gap-2">
                  {suggestions.map((val) => (
                    <button
                      key={val}
                      onClick={() => setCustomerCash(val)}
                      className={`flex-1 p-2 rounded-full border text-sm font-medium transition-all ${customerCash === val
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {formatVND(val).replace(' ₫', '').trim()}
                    </button>
                  ))}
                </div>
                <div className="bg-blue-50/50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Tiền thừa trả khách</span>
                  <span className="text-blue-600 font-bold text-lg">
                    {formatVND(
                      Math.max(0, customerCash - Math.max(0, total - discountAmount))
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 rounded-xl border-gray-200"
              >
                Huỷ
              </Button>
              <Button
                onClick={handleConfirmPayment}
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
<<<<<<< Updated upstream
=======

      {viewingReceipt && (
        <ReceiptModal
          order={viewingReceipt}
          onClose={() => {
            setViewingReceipt(null);
            onClose();
          }}
          onPrint={() => {
            // Optional: call markPrintSuccess if needed
          }}
        />
      )}
>>>>>>> Stashed changes
    </>
  );
}
