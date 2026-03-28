import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";
import orderOnlineService from "@/services/orderOnlineService";
import toppingService from "@/services/toppingService";
import discountService from "@/services/discountService";

export default function MyOrderQRDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const selected = state?.selected || [];
  const tableId = state?.tableId || "";
  const menu = state?.menu || [];

  const [form, setForm] = useState({ note: "", discountCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toppingsList, setToppingsList] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [modalConfig, setModalConfig] = useState({ show: false, title: "", message: "", type: "warning", onConfirm: null });

  useEffect(() => {
    toppingService.getAll().then(res => {
      setToppingsList(res?.data || res || []);
    }).catch(() => setToppingsList([]));

    discountService.getPublic().then(res => {
      setDiscounts(res?.data || res || []);
    }).catch(err => console.error("Error fetching discounts", err));
  }, []);

  useEffect(() => {
    if (!selected || selected.length === 0) {
      navigate(`/order?table=${tableId}`);
    }
  }, [selected, tableId, navigate]);

  // Calculate total price
  const totalAmount = selected.reduce((total, item) => {
    const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
    let price = 0;
    if (item.size && Array.isArray(menuItem?.sizes)) {
      const sizeObj = menuItem.sizes.find(sz => sz.size === item.size);
      if (sizeObj) price = Number(sizeObj.price);
    } else {
      price = Number(menuItem?.price || 0);
    }
    
    let itemTotal = price * (item.qty || 1);
    if (Array.isArray(item.toppings)) {
      item.toppings.forEach(tp => {
        itemTotal += (tp.price || 0) * (tp.quantity || 1);
      });
    }
    return total + itemTotal;
  }, 0);

  const calculateDiscountAmount = (total) => {
    if (!form.discountCode) return 0;
    const discount = discounts.find(d => d.code === form.discountCode);
    if (!discount) return 0;
    
    if (discount.min_order_amount && total < Number(discount.min_order_amount)) return 0;
    
    const percentage = Number(discount.percentage || 0);
    let calculated = Math.round((total * percentage) / 100);
    
    if (discount.max_discount_amount) {
      calculated = Math.min(calculated, Number(discount.max_discount_amount));
    }
    return calculated;
  };

  const discountAmount = calculateDiscountAmount(totalAmount);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const itemsPayload = [];
      
      for (const item of selected) {
        const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
        if (!menuItem) continue;
        
        let product_size_id = null;
        if (item.size && Array.isArray(menuItem.sizes)) {
          const sizeObj = menuItem.sizes.find(sz => sz.size === item.size);
          if (sizeObj) {
            product_size_id = sizeObj.id || sizeObj.product_size_id || sizeObj._id;
          }
        } else if (Array.isArray(menuItem.sizes) && menuItem.sizes.length > 0) {
           setModalConfig({ show: true, type: "warning", title: "Chú ý", message: `Vui lòng chọn size cho món: ${menuItem.name}` });
           setSubmitting(false);
           return;
        }
        
        // Ensure we pass a valid string for table_id, even if it's numeric in url
        itemsPayload.push({
          product_size_id: Number(product_size_id),
          quantity: Number(item.qty || 1),
          note: item.note || null,
          toppings: Array.isArray(item.toppings) ? item.toppings.map(t => ({
             topping_id: Number(t.topping_id),
             quantity: Number(t.quantity || 1) // default 1
          })) : []
        });
      }

      // table_id is custom field for dine_in
      const payload = {
        tableId: tableId, 
        items: itemsPayload,
        note: form.note.trim(),
        discountCode: form.discountCode.trim(),
        paymentMethod: paymentMethod
      };

      const orderRes = await orderOnlineService.checkoutQr(payload);
      const orderData = orderRes?.data || {};

      if (paymentMethod === "payos") {
        const checkoutUrl = orderData?.checkoutUrl;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        } else {
          setModalConfig({ show: true, type: "warning", title: "Lỗi thanh toán", message: "Không lấy được link thanh toán PayOS" });
        }
      } else {
        setModalConfig({ 
          show: true, 
          type: "success", 
          title: "Thành công", 
          message: "Đặt món thành công! Vui lòng chờ lát nhé.", 
          onConfirm: () => navigate(`/order?table=${tableId}`) 
        });
      }
    } catch (err) {
      console.error("Order error", err);
      setModalConfig({ show: true, type: "warning", title: "Lỗi đặt món", message: err?.response?.data?.message || "Có lỗi xảy ra khi xác nhận đơn, vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selected || selected.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white border-b py-3 px-4 shadow-sm flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-gray-600 hover:text-primary transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold flex-1 text-center pr-8">Xác nhận đặt món</h1>
      </header>

      {/* CONTENT */}
      <main className="flex-1 px-4 py-4 space-y-4">
        
        {/* Bàn */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Bàn phục vụ</span>
          <span className="font-bold text-lg text-primary">{tableId}</span>
        </div>

        {/* Danh sách món */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-lg mb-3">Món đã chọn</h2>
          <div className="divide-y divide-gray-100">
            {selected.map((item, idx) => {
              const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
              let basePrice = 0;
              if (item.size && Array.isArray(menuItem?.sizes)) {
                const sz = menuItem.sizes.find(s => s.size === item.size);
                if (sz) basePrice = Number(sz.price);
              } else {
                basePrice = Number(menuItem?.price || 0);
              }

              return (
                <div key={`${item.id}-${idx}`} className="py-3 items-start flex justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.size && <span className="mr-2">Size {item.size}</span>}
                      <span>SL: {item.qty || 1}</span>
                    </div>
                    
                    {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.toppings.map((tp, tidx) => {
                           const tpObj = toppingsList.find(t => t.id === tp.topping_id);
                           const tName = tpObj?.name || 'Topping';
                           const tPrice = Number(tpObj?.price || tp.price || 0);
                           const tPriceStr = tPrice > 0 ? ` (+${tPrice.toLocaleString()}đ)` : '';
                           return (
                             <div key={tidx} className="text-xs text-gray-500 flex justify-between">
                               <span>+ {tName}{tPriceStr}</span>
                             </div>
                           )
                        })}
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-xs italic text-amber-600 mt-1">Ghi chú: {item.note}</div>
                    )}
                  </div>
                  
                  <div className="font-semibold text-sm">
                    {(basePrice * (item.qty || 1)).toLocaleString()}đ
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg">Thông tin khách (Tùy chọn)</h2>
          

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Ghi chú chung</label>
            <Textarea 
              placeholder="Ghi chú thêm cho quán (tùy chọn)" 
              value={form.note}
              onChange={(e) => setForm(f => ({...f, note: e.target.value}))}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mã giảm giá</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.discountCode}
              onChange={(e) => setForm(f => ({...f, discountCode: e.target.value}))}
            >
              <option value="">-- Không áp dụng mã --</option>
              {discounts.map(d => (
                <option key={d.id} value={d.code}>
                  {d.code} - Giảm {Number(d.percentage)}%
                </option>
              ))}
            </select>
            {discountAmount > 0 && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                Được giảm: -{discountAmount.toLocaleString()}đ
              </p>
            )}
          </div>
        </div>



      </main>

      {/* FOOTER BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] max-w-lg mx-auto w-full">
        <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
          <span>Tổng thanh toán</span>
          <div className="flex flex-col items-end">
            {discountAmount > 0 && <span className="text-xs text-gray-400 line-through">{totalAmount.toLocaleString()}đ</span>}
            <span className="text-xl font-bold text-primary">{finalAmount.toLocaleString()}đ</span>
          </div>
        </div>
        <Button 
          className="w-full py-4 text-base font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition shadow-md"
          size="lg"
          onClick={() => setShowPaymentModal(true)}
          disabled={submitting}
        >
          {submitting ? "Đang xử lý..." : "Xác nhận đặt món"}
        </Button>
      </div>

      {/* MODAL CHỌN PHƯƠNG THỨC THANH TOÁN */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl border-t border-gray-200 p-6 animate-in slide-in-from-bottom-5 relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-red-500 transition">&times;</button>
            <h2 className="font-bold text-xl mb-4 text-center tracking-tight">Thanh toán</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-100 text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-3xl mb-2">💵</span>
                <span className="text-sm font-semibold">Tiền mặt</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("payos")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                  paymentMethod === "payos"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-100 text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-3xl mb-2">💳</span>
                <span className="text-sm font-semibold">PayOS (QR)</span>
              </button>
            </div>
            
            <Button 
              className="w-full py-4 text-base font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition shadow-md"
              size="lg"
              onClick={() => {
                setShowPaymentModal(false);
                handleConfirm();
              }}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận & Đặt món"}
            </Button>
          </div>
        </div>
      )}
      {/* GLOBAL MODAL */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${modalConfig.type === "success" ? "bg-green-100" : "bg-red-100"}`}>
              {modalConfig.type === "success" ? (
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalConfig.title || "Thông báo"}</h3>
            <p className="text-gray-600 mb-6">{modalConfig.message}</p>
            <Button 
              className={`w-full py-3 rounded-full text-base font-bold text-white transition ${modalConfig.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}`}
              onClick={() => {
                const onC = modalConfig.onConfirm;
                setModalConfig({ ...modalConfig, show: false });
                if (onC) onC();
              }}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
