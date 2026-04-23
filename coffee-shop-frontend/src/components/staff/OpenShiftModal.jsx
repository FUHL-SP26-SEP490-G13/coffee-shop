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
import authenticationService from "@/services/authenticationService";
import cashSessionService from "@/services/cashSessionService";
import { format } from "date-fns";

export function OpenShiftModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [openingCash, setOpeningCash] = useState("");
  const [note, setNote] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftInfo, setShiftInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(new Date());
      setOpeningCash("");
      setNote("");

      const fetchProfile = async () => {
        try {
          const res = await authenticationService.getProfile();
          const user = res?.data?.id ? res.data : (res?.data?.data || res?.data);
          if (user) {
            setUserName(`${user.last_name || ""} ${user.first_name || ""}`.trim() || user.username);
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin cá nhân", error);
        }
      };
      const fetchShift = async () => {
        try {
          const res = await cashSessionService.getMyCurrentShift();
          if (res?.data) {
            setShiftInfo(res.data);
          } else {
            setShiftInfo(null);
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin ca", error);
        }
      };

      fetchProfile();
      fetchShift();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await authenticationService.logout();
      window.location.href = "/";
    } catch (error) {
      toast.error("Không thể đăng xuất");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Xóa dấu phẩy/chấm để lấy số nguyên
    const cashValue = openingCash.replace(/\D/g, "");

    if (!cashValue || isNaN(cashValue) || Number(cashValue) < 0) {
      toast.error("Vui lòng nhập tiền mặt đầu ca hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const res = await cashSessionService.openSession({
        opening_cash: Number(cashValue),
        opening_note: note,
      });

      if (res?.success) {
        toast.success("Mở ca thành công!");
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể mở ca");
    } finally {
      setLoading(false);
    }
  };

  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setOpeningCash("");
      return;
    }
    setOpeningCash(new Intl.NumberFormat("vi-VN").format(rawValue));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Chặn đóng modal bằng cách bấm ra ngoài nếu cần, nhưng ở đây cứ cho đóng
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
        <DialogTitle className="sr-only">Mở ca làm việc</DialogTitle>
        <DialogDescription className="sr-only">Nhập số dư đầu ca để bắt đầu làm việc</DialogDescription>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Mở ca làm việc</h2>
        </div>

        <div className="px-6 py-4 bg-slate-50/50">
          <p className="text-sm text-slate-500 mb-6">
            Vui lòng mở ca làm việc mới để có thể thực hiện được các chức năng dành cho nhân viên thu ngân
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 col-span-1">
                Nhân viên ca <span className="text-red-500">*</span>
              </label>
              <div className="col-span-3">
                <Input
                  value={userName}
                  disabled
                  className="bg-transparent border-0 border-b border-slate-200 rounded-none shadow-none focus-visible:ring-0 px-0 disabled:opacity-100 disabled:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 col-span-1">
                Giờ bắt đầu
              </label>
              <div className="col-span-3">
                <Input
                  value={format(currentTime, "dd/MM/yyyy HH:mm")}
                  disabled
                  className="bg-transparent border-0 border-b border-slate-200 rounded-none shadow-none focus-visible:ring-0 px-0 disabled:opacity-100 disabled:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 col-span-1">
                Ca làm việc
              </label>
              <div className="col-span-3">
                <Input
                  value={shiftInfo ? `${shiftInfo.shift_name} (${shiftInfo.start_time.substring(0, 5)} - ${shiftInfo.end_time.substring(0, 5)})` : "---"}
                  disabled
                  className="bg-transparent border-0 border-b border-slate-200 rounded-none shadow-none focus-visible:ring-0 px-0 disabled:opacity-100 disabled:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 col-span-1">
                Tiền đầu ca <span className="text-red-500">*</span>
              </label>
              <div className="col-span-3">
                <Input
                  value={openingCash}
                  onChange={handleCashChange}
                  placeholder="0"
                  className="bg-transparent border-0 border-b border-slate-300 rounded-none shadow-none focus-visible:ring-0 px-0 font-bold text-lg text-primary focus-visible:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-semibold text-slate-700 col-span-1">
                Ghi chú
              </label>
              <div className="col-span-3">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú nếu có..."
                  className="bg-transparent border-0 border-b border-slate-200 rounded-none shadow-none focus-visible:ring-0 px-0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-6 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              >
                {loading ? "Đang xử lý..." : "Mở ca"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
