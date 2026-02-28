import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import tableService from "@/services/tableService";

export default function TableModal({ isOpen, onClose, table, areas, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    table_number: "",
    area_id: "",
    status: "available",
  });

  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || "",
        area_id: table.area_id?.toString() || "",
        status: table.status || "available",
      });
    } else {
      setFormData({
        table_number: "",
        area_id: areas.length > 0 ? areas[0].id.toString() : "",
        status: "available",
      });
    }
  }, [table, isOpen, areas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.area_id) {
      toast.error("Vui lòng chọn khu vực");
      return;
    }

    try {
      setLoading(true);
      if (table) {
        await tableService.update(table.id, formData);
        toast.success("Cập nhật bàn thành công");
      } else {
        await tableService.create(formData);
        toast.success("Thêm bàn mới thành công");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{table ? "Chỉnh sửa bàn" : "Thêm bàn mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="area">Khu vực</Label>
            <Select 
              value={formData.area_id} 
              onValueChange={(val) => setFormData({ ...formData, area_id: val })}
            >
              <SelectTrigger id="area">
                <SelectValue placeholder="Chọn khu vực" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="table_number">Số bàn / Tên bàn</Label>
            <Input
              id="table_number"
              placeholder="VD: 01, VIP-01..."
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select 
              value={formData.status} 
              onValueChange={(val) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Trống (Available)</SelectItem>
                <SelectItem value="occupied">Có khách (Occupied)</SelectItem>
                <SelectItem value="reserved">Đã đặt (Reserved)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : table ? "Lưu thay đổi" : "Tạo bàn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
