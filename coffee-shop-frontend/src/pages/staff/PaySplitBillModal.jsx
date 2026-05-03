import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ReceiptText, Wallet, HandCoins, CheckCircle2, XCircle } from "lucide-react";
import orderService from "@/services/orderService";
import tableService from "@/services/tableService";
import PayOSLogo from "/logo/payOS.svg";

const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(amount || 0)
  );

const BILLS = [10000, 20000, 50000, 100000, 200000, 500000];


export function PaySplitBillModal({ isOpen, onClose, table, onSuccess, onPartialPayment }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerCash, setCustomerCash] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayingAll, setIsPayingAll] = useState(false);

  const activePayingOrder = useMemo(() => orders.find(o => o.id === payingOrderId), [orders, payingOrderId]);

  const totalAmountToPay = useMemo(() => {
    if (isPayingAll) {
      return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    }
    return activePayingOrder?.total_amount || 0;
  }, [isPayingAll, orders, activePayingOrder]);

  const suggestions = useMemo(() => {
    const amt = Number(totalAmountToPay || 0);
    if (amt <= 0) return [];
    const base = [amt, ...BILLS.filter((v) => v > amt)];
    const roundUp = Math.ceil(amt / 10000) * 10000;
    if (!base.includes(roundUp)) base.splice(1, 0, roundUp);
    return [...new Set(base)].slice(0, 4);
  }, [totalAmountToPay]);



  useEffect(() => {
    if (isOpen && table?.id) {
      fetchUnpaidOrders();
    }
  }, [isOpen, table?.id]);

  const fetchUnpaidOrders = async () => {
    setLoading(true);
    try {
      const res = await tableService.getUnpaidOrders(table.id);
      const unpaidOrders = res.data || [];

      // Fetch details for each order to get items
      const detailedOrders = await Promise.all(
        unpaidOrders.map(async (order) => {
          try {
            const detailRes = await orderService.getOrderDetailForStaff(order.id);
            return detailRes.data;
          } catch (err) {
            console.error(`Error fetching order ${order.id}:`, err);
            return order; // Fallback to basic order info
          }
        })
      );

      setOrders(detailedOrders);
    } catch (err) {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };



  const handleStartPayment = (order) => {
    setIsPayingAll(false);
    setPayingOrderId(order.id);
    setCustomerCash(order.total_amount);
    setPaymentMethod("cash");
  };

  const handleStartPayAll = () => {
    setIsPayingAll(true);
    setPayingOrderId(null);
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    setCustomerCash(totalAmount);
    setPaymentMethod("cash");
  };

  const handleConfirmPayment = async () => {
    const amountToPay = totalAmountToPay;


    if (paymentMethod === 'cash' && customerCash < amountToPay) {
      toast.error('Số tiền khách đưa không đủ');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderIdsToSettle = isPayingAll
        ? orders.map(o => o.id)
        : [activePayingOrder.id];

      await tableService.settleDebt(table.id, {
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? customerCash : null,
        order_ids: orderIdsToSettle
      });

      toast.success(isPayingAll ? "Đã thanh toán tất cả đơn hàng" : `Thanh toán thành công đơn #${activePayingOrder.id}`);

      if (isPayingAll) {
        setOrders([]);
        onSuccess?.();
        onClose();
      } else {
        const remainingOrders = orders.filter(o => o.id !== activePayingOrder.id);
        setOrders(remainingOrders);
        setPayingOrderId(null);

        if (remainingOrders.length === 0) {
          onSuccess?.();
          onClose();
        } else {
          // Still more orders to pay — notify parent to refresh debt badge
          onPartialPayment?.();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thanh toán thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayOS = async () => {
    const orderToPay = isPayingAll ? orders[0] : activePayingOrder; // PayOS usually handles one order at a time in current setup
    if (!orderToPay) return;

    if (isPayingAll && orders.length > 1) {
      toast.info("PayOS hiện tại chỉ hỗ trợ thanh toán từng đơn. Vui lòng chọn thanh toán lẻ hoặc dùng tiền mặt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const returnUrl = `${window.location.origin}/staff/tables?debtPay=1&tableId=${table.id}&orderId=${orderToPay.id}`;
      const cancelUrl = `${window.location.origin}/staff/tables?debtPay=0&tableId=${table.id}&orderId=${orderToPay.id}`;

      const res = await orderService.createPaymentLink({
        orderCode: Number(orderToPay.id),
        amount: Math.round(Number(orderToPay.total_amount || 0)),
        description: `DH${orderToPay.id}`.slice(0, 25),
        items: [
          {
            name: `Order #${orderToPay.id}`.slice(0, 100),
            quantity: 1,
            price: Math.round(Number(orderToPay.total_amount || 0)),
          },
        ],
        returnUrl,
        cancelUrl,
      });

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        throw new Error("Không nhận được link thanh toán");
      }
    } catch (error) {
      toast.error("Không thể khởi tạo thanh toán QR");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl dark:shadow-none rounded-2xl">
        <div className="flex flex-col h-[85vh] max-h-[700px] bg-white dark:bg-gray-900">
          <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-orange-600">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <ReceiptText className="w-6 h-6" />
              Thanh toán đơn tách — Bàn {table?.code}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Đang tải thông tin các đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Tất cả đơn tách đã được thanh toán</p>
                <Button onClick={onClose} className="mt-4 bg-orange-500 hover:bg-orange-600">Đóng</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orders List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Danh sách đơn chờ</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartPayAll}
                      className={isPayingAll ? "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/30" : ""}
                    >
                      Thanh toán tất cả
                    </Button>
                  </div>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleStartPayment(order)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        payingOrderId === order.id 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30/50 ring-2 ring-orange-200' 
                        : (isPayingAll ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50/30' : 'border-gray-100 dark:border-gray-800 hover:border-orange-200 bg-gray-50 dark:bg-gray-800/50/50')
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">Đơn #{order.id}</span>
                        <span className="text-orange-600 font-black">{formatVND(order.total_amount)}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.product_name || item.name}</span>
                            <span>{formatVND(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Form */}
                <div className="border-l pl-6 space-y-6">
                  {payingOrderId || isPayingAll ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                          {isPayingAll ? "Thanh toán tất cả" : `Thanh toán đơn #${payingOrderId}`}
                        </h3>
                        <p className="text-orange-500 text-2xl font-black">
                          {formatVND(isPayingAll
                            ? orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
                            : activePayingOrder?.total_amount
                          )}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phương thức</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              paymentMethod === 'cash' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            <HandCoins className="w-6 h-6" />
                            <span className="text-xs font-bold">Tiền mặt</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('payos')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              paymentMethod === 'payos' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            <img src={PayOSLogo} alt="PayOS" className="h-6 w-6" />
                            <span className="text-xs font-bold">Quét mã QR</span>
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'cash' && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiền khách đưa</label>
                            <Input
                              type="number"
                              value={customerCash}
                              onChange={(e) => setCustomerCash(Number(e.target.value))}
                              className="text-xl font-bold h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((val) => {
                              const selected = Number(customerCash || 0) === val;
                              return (
                                <button
                                  key={val}
                                  onClick={() => setCustomerCash(val)}
                                  className={`flex-1 p-2 rounded-full border text-xs font-medium transition-all ${
                                    selected
                                      ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
                                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50"
                                  }`}
                                >
                                  {formatVND(val).replace(/\s?₫/, "").trim()}
                                </button>
                              );
                            })}
                          </div>

                          {customerCash > totalAmountToPay && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex justify-between items-center border border-blue-100">
                              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">Tiền thừa:</span>
                              <span className="text-blue-700 dark:text-blue-400 font-black">
                                {formatVND(customerCash - totalAmountToPay)}
                              </span>
                            </div>
                          )}

                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-4">
                        <Button
                          onClick={paymentMethod === 'cash' ? handleConfirmPayment : handlePayOS}
                          disabled={isSubmitting}
                          className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg dark:shadow-none shadow-green-200"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Xác nhận thanh toán'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setPayingOrderId(null);
                            setIsPayingAll(false);
                          }}
                          disabled={isSubmitting}
                          className="w-full text-gray-400 hover:text-gray-600 dark:text-gray-400"
                        >
                          Hủy chọn
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground space-y-4">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-sm">Vui lòng chọn một đơn hàng<br />ở bên trái để tiến hành thanh toán</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
