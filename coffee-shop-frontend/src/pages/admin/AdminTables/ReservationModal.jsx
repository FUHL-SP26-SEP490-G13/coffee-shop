import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import tableService from "@/services/tableService";

export default function ReservationModal({ isOpen, onClose, table, onSuccess }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !phone || !reservationTime) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    try {
      setLoading(true);
      await tableService.reserve(table.id, {
        customerName,
        phone,
        reservationTime
      });
      toast.success("Đặt bàn thành công");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Đặt bàn thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt bàn {table?.code}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên khách hàng</label>
            <Input 
              placeholder="Nhập tên khách hàng" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input 
              placeholder="Nhập số điện thoại" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Thời gian đặt</label>
            <Input 
              type="datetime-local"
              value={reservationTime}
              onChange={(e) => setReservationTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
