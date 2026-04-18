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
import { useNavigate } from 'react-router-dom';
import authenticationService from '@/services/authenticationService';
import { Pencil } from 'lucide-react';

const CashSessionContext = createContext({});

export const useCashSession = () => useContext(CashSessionContext);

export const CashSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null); // format: '18:00:00'
  const [loading, setLoading] = useState(true);
  
  // States for Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isForcedClose, setIsForcedClose] = useState(false);
  const [userName, setUserName] = useState('');
  
  // Forms
  const [openingCash, setOpeningCash] = useState("");
  const [openingNote, setOpeningNote] = useState("");
  const [closingCashActual, setClosingCashActual] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      const res = await cashSessionService.getCurrent();
      if (res.data) {
        setSession(res.data.session);
        setShiftEndTime(res.data.shiftEndTime);
        setUserName(res.data.userName || '');
        if (!res.data.session) {
          setShowOpenModal(true);
        } else {
          setShowOpenModal(false);
          // Ép đóng ca nếu ca đang mở là của người khác
          if (
            res.data.session.opened_by && 
            res.data.currentUserId && 
            res.data.session.opened_by !== res.data.currentUserId
          ) {
            setIsForcedClose(true);
            setShowCloseModal(true);
          }
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

  useEffect(() => {
    let interval;
    if (session && shiftEndTime) {
      interval = setInterval(() => {
        const now = new Date();
        const [h, m, s] = shiftEndTime.split(':').map(Number);
        const end = new Date();
        end.setHours(h, m, s || 0, 0);

        // Xử lý ca làm việc vắt qua đêm (cross-day shifts)
        if (now - end > 12 * 60 * 60 * 1000) {
          end.setDate(end.getDate() + 1);
        } else if (end - now > 12 * 60 * 60 * 1000) {
          end.setDate(end.getDate() - 1);
        }

        const diffMinutes = (now - end) / 60000;
        if (diffMinutes >= 15) {
          setIsForcedClose(true);
          setShowCloseModal(true);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [session, shiftEndTime]);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!openingCash || isNaN(openingCash)) {
      setErrorMessage("Vui lòng nhập số tiền đầu ca hợp lệ");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await cashSessionService.openSession({ opening_cash: Number(openingCash), note: openingNote });
      toast.success("Mở ca thành công");
      await checkSession();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Lỗi hệ thống khi mở ca. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authenticationService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const handleTriggerClose = () => {
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
      setIsForcedClose(false);
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
    <CashSessionContext.Provider value={{ session, shiftEndTime, handleTriggerClose }}>
      {!loading && children}

      {/* Force Open Shift Modal */}
      <Dialog open={showOpenModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-xl [&>button]:hidden px-8 py-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">Mở ca làm việc</DialogTitle>
            <DialogDescription className="text-slate-600 text-[15px] leading-relaxed mt-2">
              Vui lòng mở ca làm việc mới để có thể thực hiện được các chức năng dành cho nhân viên thu ngân
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleOpenSession} className="space-y-5">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label className="text-slate-700 font-semibold text-[15px]">Nhân viên ca <span className="text-red-500">*</span></Label>
              <div className="text-slate-400 font-medium text-[15px] border-b border-slate-200 pb-1 w-full">{userName}</div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label className="text-slate-700 font-semibold text-[15px]">Giờ bắt đầu</Label>
              <div className="text-amber-500 bg-amber-50 px-2 py-1 rounded w-fit font-medium text-[15px]">
                {new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(',', '')}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label htmlFor="opening_cash" className="text-slate-700 font-semibold text-[15px]">Tiền mặt đầu ca <span className="text-red-500">*</span></Label>
              <Input
                id="opening_cash"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                min="0"
                required
                className="border-0 border-b border-blue-500 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-blue-600 font-medium text-[15px] h-8"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label htmlFor="opening_note" className="text-slate-700 font-semibold text-[15px]">Ghi chú</Label>
              <div className="relative w-full border-b border-slate-200">
                <Pencil className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="opening_note"
                  value={openingNote}
                  onChange={(e) => setOpeningNote(e.target.value)}
                  className="border-0 rounded-none px-6 shadow-none focus-visible:ring-0 w-full h-8"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-rose-600 bg-rose-50 p-3 rounded-lg text-[14px] font-medium border border-rose-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="secondary" onClick={handleLogout} className="bg-slate-100 hover:bg-slate-200 text-blue-600 font-semibold px-6 rounded-xl">
                Đăng xuất
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#0b5cff] hover:bg-[#094bdd] text-white font-semibold px-8 rounded-xl">
                {isSubmitting ? "Đang mở..." : "Mở ca"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Shift Modal */}
      <Dialog open={showCloseModal} onOpenChange={isForcedClose ? () => {} : setShowCloseModal}>
        <DialogContent className={isForcedClose ? "sm:max-w-xl [&>button]:hidden" : "sm:max-w-xl"}>
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

              {session.handoverStats && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-2">
                  <p className="text-sm font-bold text-amber-800 border-b border-amber-200/60 pb-2">Thống kê đơn hàng bàn giao cho ca sau</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-amber-900">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Chờ xử lý:</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded">{session.handoverStats.pending_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Đang chuẩn bị:</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded">{session.handoverStats.preparing_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Chờ phục vụ/giao:</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded">{session.handoverStats.done_count}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-600">
                      <span className="font-bold">Đơn chưa thu tiền:</span>
                      <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm">{session.handoverStats.unpaid_count}</span>
                    </div>
                  </div>
                </div>
              )}

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
                {!isForcedClose && (
                  <Button type="button" variant="outline" onClick={() => setShowCloseModal(false)} disabled={isSubmitting}>
                    Hủy
                  </Button>
                )}
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
