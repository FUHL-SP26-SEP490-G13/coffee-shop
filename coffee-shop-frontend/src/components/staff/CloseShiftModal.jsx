import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import cashSessionService from "@/services/cashSessionService";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import PrintableShiftReceipt from "./PrintableShiftReceipt";

export function CloseShiftModal({ isOpen, onClose, session, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  const [actualCashStr, setActualCashStr] = useState("");
  const [note, setNote] = useState("");
  const [printData, setPrintData] = useState(null);
  
  const [activeSession, setActiveSession] = useState(session);

  useEffect(() => {
    if (isOpen && session?.id) {
      setActiveSession(session);
      setActualCashStr("");
      setNote("");
      fetchSummary();
    }
  }, [isOpen, session?.id]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await cashSessionService.getSummary(session.id);
      if (res?.success) {
        setSummaryData(res.data);
      }
    } catch (error) {
      toast.error("Không thể lấy thông tin tổng kết ca");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat("vi-VN").format(val || 0);
  };

  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setActualCashStr("");
      return;
    }
    setActualCashStr(formatMoney(rawValue));
  };

  const handleSubmit = async (printReceipt = false) => {
    const actualCash = Number(actualCashStr.replace(/\D/g, ""));
    
    if (actualCashStr === "" || isNaN(actualCash) || actualCash < 0) {
      toast.error("Vui lòng nhập tiền mặt bàn giao thực tế hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      const res = await cashSessionService.closeSession(activeSession.id, {
        closing_cash_actual: actualCash,
        closing_note: note
      });
      
      if (res?.success) {
        toast.success("Đóng ca thành công!");
        // Handle printing if requested
        if (printReceipt) {
          setPrintData({ session: activeSession, summaryData, actualCash });
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể đóng ca");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSystemCash = summaryData?.summary?.current_cash_system || 0;
  const actualCashNum = Number(actualCashStr.replace(/\D/g, "")) || 0;
  const difference = actualCashStr ? actualCashNum - currentSystemCash : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1100px] w-[95vw] p-0 overflow-hidden bg-slate-50">
        <DialogDescription className="sr-only">Chi tiết phiếu bàn giao ca và tổng kết doanh thu</DialogDescription>
        <DialogHeader className="px-6 py-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg flex items-center gap-3">
            <span className="font-bold text-slate-800">Phiếu bàn giao ca: {activeSession?.code}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">Đang mở</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-3 bg-white flex items-center justify-between text-sm text-slate-600 border-b border-slate-100">
          <div>
            Nhân viên: <span className="font-semibold text-slate-900">{activeSession?.opened_by?.name || "N/A"}</span>
          </div>
          <div>
            Giờ mở ca: <span className="font-semibold text-slate-900">{activeSession?.opened_at ? format(new Date(activeSession.opened_at), "dd/MM/yyyy HH:mm") : "---"}</span>
          </div>
          <div>
            Giờ đóng ca: <span className="text-slate-400">Chưa đóng</span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Đang tải dữ liệu ca...</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
            {/* 1. Tiền mặt đầu ca */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center shadow-sm">
              <span className="font-semibold text-slate-700">Tiền mặt đầu ca</span>
              <span className="text-xl font-bold text-blue-600">{formatMoney(summaryData?.summary?.opening_cash)}</span>
            </div>

            {/* 2. Tiền mặt trong ca */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <span className="font-semibold text-slate-700">Tiền mặt trong ca</span>
                <span className="text-xl font-bold text-blue-600">+{formatMoney(summaryData?.summary?.cash_revenue)}</span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                  <span className="font-bold text-slate-800 text-base">
                    Chi tiết Bán hàng 
                    <span className="text-slate-500 font-medium ml-2 bg-white px-2 py-0.5 rounded-full text-xs border border-slate-200">
                      {summaryData?.summary?.total_orders || 0} hóa đơn
                    </span>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Tiền mặt thu được
                    </span>
                    <span className="text-2xl font-bold text-slate-800">{formatMoney(summaryData?.summary?.cash_revenue)}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                    <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      Chuyển khoản (PayOS)
                    </span>
                    <span className="text-2xl font-bold text-slate-800">{formatMoney(summaryData?.summary?.payos_revenue)}</span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-blue-50/80 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
                    <span className="text-sm font-bold text-blue-700 relative z-10">TỔNG DOANH THU</span>
                    <span className="text-3xl font-black text-blue-700 relative z-10">{formatMoney(summaryData?.summary?.total_revenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tiền mặt cuối ca */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                <span className="font-semibold text-slate-700">Tiền mặt cuối ca (Hệ thống tính)</span>
                <span className="text-2xl font-bold text-blue-600">{formatMoney(currentSystemCash)}</span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Tiền mặt bàn giao thực tế <span className="text-red-500">*</span></label>
                  <Input 
                    value={actualCashStr}
                    onChange={handleCashChange}
                    placeholder="Nhập số tiền đếm được"
                    className="border-0 border-b-2 border-slate-300 rounded-none shadow-none px-1 text-lg font-bold focus-visible:ring-0 focus-visible:border-blue-600 h-10"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Số tiền chênh lệch</label>
                  <div className={`h-10 flex items-center px-1 text-lg font-bold ${
                    actualCashStr === "" ? "text-slate-400" :
                    difference > 0 ? "text-emerald-500" : 
                    difference < 0 ? "text-rose-500" : "text-slate-700"
                  }`}>
                    {actualCashStr === "" ? "---" : formatMoney(difference)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600">Ghi chú</label>
                  <Input 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Thiếu 5k do thối nhầm"
                    className="border-0 border-b-2 border-slate-200 rounded-none shadow-none px-1 h-10 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>


          </div>
        )}

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
            onClick={fetchSummary}
            disabled={loading || submitting}
          >
            Cập nhật dữ liệu
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl px-6 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              onClick={() => handleSubmit(false)}
              disabled={loading || submitting}
            >
              Đóng ca
            </Button>
            <Button
              className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              onClick={() => handleSubmit(true)}
              disabled={loading || submitting}
            >
              {submitting ? "Đang xử lý..." : "Đóng ca và in phiếu bàn giao"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {printData && (
        <PrintableShiftReceipt
          session={printData.session}
          summaryData={printData.summaryData}
          actualCash={printData.actualCash}
          onDone={() => {
            setPrintData(null);
            onSuccess?.();
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}
