import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import cashSessionService from '@/services/cashSessionService';

const CashSessionContext = createContext({});

export const useCashSession = () => useContext(CashSessionContext);

export const CashSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null); // format: '18:00:00'
  const [loading, setLoading] = useState(true);
  
  // States for Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  // Forms
  const [openingCash, setOpeningCash] = useState("");
  const [closingCashActual, setClosingCashActual] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await cashSessionService.getCurrent();
      if (res.data) {
        setSession(res.data.session);
        setShiftEndTime(res.data.shiftEndTime);
        if (!res.data.session) {
          setShowOpenModal(true);
        } else {
          setShowOpenModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    if (!openingCash || isNaN(openingCash)) {
      toast.error("Vui lòng nhập số tiền đầu ca hợp lệ");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await cashSessionService.openSession({ opening_cash: Number(openingCash) });
      toast.success("Mở ca thành công");
      await checkSession();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi mở ca");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTimeToClose = () => {
    if (!shiftEndTime) return true; // Let them close if no shift found
    const now = new Date();
    const [h, m, s] = shiftEndTime.split(':').map(Number);
    const end = new Date();
    end.setHours(h, m, s || 0, 0);
    return now >= end;
  };

  const handleTriggerClose = () => {
    if (!isTimeToClose()) {
      toast.error(`Chưa đến giờ kết thúc ca làm việc (${shiftEndTime}).`);
      return;
    }
    checkSession().then(() => {
      setClosingCashActual("");
      setClosingNote("");
      setShowCloseModal(true);
    });
  };

  const handleCloseSession = async (e) => {
    e.preventDefault();
    if (closingCashActual === "" || isNaN(closingCashActual)) {
      toast.error("Vui lòng nhập tổng tiền thực tế nhận được");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await cashSessionService.closeSession({
        id: session.id,
        closing_cash_actual: Number(closingCashActual),
        closing_note: closingNote
      });
      toast.success(`Đóng ca thành công. Tiền chênh lệch: ${Number(res.data.difference).toLocaleString('vi-VN')} đ`);
      setShowCloseModal(false);
      setSession(null);
      setShowOpenModal(true); // Must open a new session or wait for the next shift
      // In this system, one staff per shift, so maybe they just log out after closing.
      // Easiest is to just re-evaluate checkSession().
      await checkSession();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đóng ca");
    } finally {
      setIsSubmitting(false);
    }
  };

  const moneyFormat = (num) => Number(num || 0).toLocaleString('vi-VN') + " đ";

  return (
    <CashSessionContext.Provider value={{ session, shiftEndTime, handleTriggerClose, isTimeToClose }}>
      {!loading && children}

      {/* Force Open Shift Modal */}
      <Dialog open={showOpenModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Bắt Đầu Ca Làm Việc</DialogTitle>
            <DialogDescription>
              Bạn chưa có ca làm việc nào đang mở. Vui lòng nhập số tiền đầu ca hiện có trong két để mở ca và sử dụng hệ thống.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="opening_cash">Tiền đầu ca (VND)</Label>
              <Input
                id="opening_cash"
                type="number"
                placeholder="Nhập số tiền hiện có..."
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                min="0"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang mở..." : "Mở ca làm việc"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Shift Modal */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Kết Thúc Ca Làm Việc</DialogTitle>
            <DialogDescription>
              Kiểm đếm tiền trong két và nhập số liệu thực tế để đối chiếu hệ thống.
            </DialogDescription>
          </DialogHeader>
          {session && (
            <form onSubmit={handleCloseSession} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Thời gian mở ca</p>
                  <p className="text-sm font-semibold">{new Date(session.opened_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Mã ca</p>
                  <p className="text-sm font-semibold">{session.code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tiền đầu ca</p>
                  <p className="text-sm font-semibold">{moneyFormat(session.opening_cash)}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-500 font-medium mb-1">Tổng tiền hệ thống (Tính riêng Tiền Mặt)</p>
                  <p className="text-base font-bold text-rose-600">{moneyFormat(session.closing_cash_system)}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="closing_cash_actual" className="font-bold">Tiền thực tế kiểm đếm (VND)</Label>
                  <Input
                    id="closing_cash_actual"
                    type="number"
                    placeholder="Nhập số tiền thực tế có trong két..."
                    value={closingCashActual}
                    onChange={(e) => setClosingCashActual(e.target.value)}
                    min="0"
                    required
                    className="text-lg font-semibold"
                  />
                  {closingCashActual !== "" ? (
                    <p className={`text-sm font-medium ${Number(closingCashActual) - session.closing_cash_system >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      Chênh lệch: {moneyFormat(Number(closingCashActual) - session.closing_cash_system)}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closing_note">Ghi chú (Tùy chọn)</Label>
                  <Input
                    id="closing_note"
                    placeholder="Giải trình nếu có chênh lệch..."
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCloseModal(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đóng..." : "Đóng ca làm"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </CashSessionContext.Provider>
  );
};
