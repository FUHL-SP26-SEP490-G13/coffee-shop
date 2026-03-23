import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import productService from '../../services/productService';
import tableService from '../../services/tableService';
import orderService from '../../services/orderService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const getProductPrice = (product, size = 'M') => {
  const sizeItem = product.sizes?.find((s) => s.size === size);
  return sizeItem ? Number(sizeItem.price) : 0;
};

const getProductImage = (product) => {
  const thumbnail = product.images?.find((img) => img.isThumbnail === 1) || product.images?.[0];
  return thumbnail ? thumbnail.image_url : 'https://via.placeholder.com/150';
};
const CASH_SUGGESTIONS = [10000, 20000, 50000, 100000, 200000, 500000];

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export function StaffPOS() {
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'payos'
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customerCash, setCustomerCash] = useState(0);
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, tablesRes] = await Promise.all([
          productService.getAll({ limit: 100 }),
          tableService.getAll()
        ]);
        setProducts(productsRes.data || []);
        setTables(tablesRes.data || []);
      } catch (error) {
        console.error("Lỗi khi truy xuất dữ liệu POS:", error);
        toast.error("Không tải được sản phẩm hoặc bàn");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id && item.size === 'M');
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          product,
          size: 'M',
          quantity: 1,
          toppings: [],
        };
        return [...prevCart, newItem];
      }
    });
  }, []);

  const updateQuantity = useCallback((id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const total = cart.reduce((acc, item) => {
    const price = getProductPrice(item.product, item.size);
    return acc + price * item.quantity;
  }, 0);

  const handleOpenPaymentModal = () => {
    if (!selectedTable) {
      toast.error('Vui lòng chọn bàn');
      return;
    }
    setDiscountAmount(0);
    setDiscountCode('');
    setDiscountError('');
    setCustomerCash(total); // Reset to current total
    setPaymentMethod('cash');
    setIsPaymentModalOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    try {
      const res = await orderService.validateDiscount({
        code: discountCode.trim(),
        order_amount: total,
      });
      setDiscountAmount(res.data.discount_amount);
      setCustomerCash(total - res.data.discount_amount); // Update cash to new total
      setDiscountError('');
      toast.success('Áp dụng mã giảm giá thành công');
    } catch (error) {
      setDiscountError(error.response?.data?.message || 'Không áp dụng được mã');
      setDiscountAmount(0);
      setCustomerCash(total); // Reset to base total
    }
  };

  const handleConfirmPayment = async () => {
    const finalTotal = Math.max(0, total - discountAmount);
    if (paymentMethod === 'cash' && customerCash < finalTotal) {
      toast.error('Tiền khách đưa không đủ');
      return;
    }

    try {
      const items = cart.map((item) => {
        const sizeItem = item.product.sizes?.find((s) => s.size === item.size);
        return {
          product_size_id: sizeItem ? sizeItem.id : null,
          quantity: item.quantity,
          toppings: item.toppings || [],
        };
      });

      if (items.some((i) => !i.product_size_id)) {
        toast.error('Có lỗi xảy ra với thông tin sản phẩm');
        return;
      }

      const payload = {
        order_type: 'dine-in',
        table_id: Number(selectedTable),
        payment_method: paymentMethod,
        receiver_name: `Khách Bàn ${tables.find((t) => String(t.id) === selectedTable)?.code || ''}`,
        receiver_phone: '0000000000',
        items,
        note: note.trim() || undefined,
        discount_code: discountAmount > 0 ? discountCode : undefined,
      };

      const res = await orderService.checkout(payload);

      if (paymentMethod === 'payos') {
        const orderId = res.data?.order_id || res.data?.id; 
        if (orderId) {
          const createRes = await orderService.createPaymentLink({
            orderCode: orderId,
            amount: finalTotal,
            description: `Thanh toán ĐH #${orderId}`,
          });
          
          if (createRes.data?.checkoutUrl) {
            window.open(createRes.data.checkoutUrl, '_blank');
          } else {
            toast.error("Không tạo được link thanh toán QR");
          }
        }
      }

      toast.success('Đơn hàng đã được đặt thành công.!');
      setCart([]);
      setSelectedTable('');
      setNote('');
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Lỗi đặt hàng POS:', error);
      toast.error(error.response?.data?.message || 'Không đặt được hàng');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const productGrid = useMemo(() => {
    return filteredProducts.map((product) => (
      <button
        key={product.id}
        onClick={() => addToCart(product)}
        className="bg-card rounded-xl p-3 border border-border hover:shadow-md transition-all text-left"
      >
        <div className="aspect-square bg-secondary rounded-lg mb-2 overflow-hidden">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-primary">
          {formatVND(getProductPrice(product, 'M'))}
        </p>
      </button>
    ));
  }, [filteredProducts, addToCart]);


  const suggestions = useMemo(() => {
    const finalAmount = Math.max(0, total - discountAmount);
    const base = [
      finalAmount,
      ...CASH_SUGGESTIONS.filter((v) => v > finalAmount),
    ];
    const roundUp = Math.ceil(finalAmount / 10000) * 10000;
    if (!base.includes(roundUp)) base.splice(1, 0, roundUp);
    return [...new Set(base)].slice(0, 4);
  }, [total, discountAmount]);

  return (
    <div className="p-4 grid grid-cols-3 gap-4 h-full w-full">
      {/* Products */}
      <div className="col-span-2 overflow-y-auto">
        <h2 className="text-xl mb-4">Bán hàng</h2>

        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-3">
          {productGrid}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-card rounded-xl p-4 border border-border flex flex-col">
        <div className="mb-4">
          <label className="text-sm mb-2 block">Bàn</label>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn bàn" />
            </SelectTrigger>
            <SelectContent>
              {tables
                .filter((t) => t.code && (t.status === 'available' || t.status === 'occupied'))
                .map((table) => (
                  <SelectItem key={table.id} value={String(table.id)}>
                    {table.code}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Thêm sản phẩm
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="bg-secondary rounded-lg p-2">
                  <div className="text-sm mb-1 line-clamp-1">{item.product.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-card flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-card flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-primary">
                      {formatVND(getProductPrice(item.product, item.size) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 mb-4">
          <label className="text-sm mb-1 block text-muted-foreground">Ghi chú</label>
          <Textarea 
            placeholder="Ví dụ: Ít đá, không đường..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm resize-none"
            rows={2}
          />
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between">
            <span>Tổng tiền</span>
            <span className="text-primary text-lg">
              {formatVND(total)}
            </span>
          </div>
          <Button onClick={handleOpenPaymentModal} className="w-full" disabled={cart.length === 0}>
            Thanh toán
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-gray-800 text-lg font-bold">Thanh toán</DialogTitle>
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
                <span className="text-orange-500">{formatVND(Math.max(0, total - discountAmount))}</span>
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
                  className="bg-orange-100 text-orange-400 hover:bg-orange-200 border-none px-4"
                >
                  Áp dụng
                </Button>
              </div>
              {discountError && <p className="text-red-500 text-xs mt-1">{discountError}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">PHƯƠNG THỨC THANH TOÁN</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 text-green-600 bg-green-50/50'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-lg">💵</span> Tiền mặt
                </button>
                <button
                  onClick={() => setPaymentMethod('payos')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                    paymentMethod === 'payos'
                      ? 'border-green-500 text-green-600 bg-green-50/50'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-lg">💳</span> QR PayOS
                </button>
              </div>
            </div>

            {/* Cash Input & Presets (Only Cash) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">TIỀN KHÁCH ĐƯA</label>
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
                        className={`flex-1 p-2 rounded-full border text-sm font-medium transition-all ${
                          customerCash === val
                            ? 'border-green-500 text-green-600 bg-green-50'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {formatVND(val).replace(' ₫', '').trim()}
                      </button>
                    ))}
                </div>

                <div className="bg-blue-50/50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Tiền thừa trả khách</span>
                  <span className="text-blue-600 font-bold text-lg">
                    {formatVND(Math.max(0, customerCash - Math.max(0, total - discountAmount)))}
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
                Thanh toán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
