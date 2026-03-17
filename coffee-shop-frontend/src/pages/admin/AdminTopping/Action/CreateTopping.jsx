import { useState } from "react";
import { toast } from "sonner";
import toppingService from "../../../../services/toppingService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export default function CreateTopping({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !price) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await toppingService.create({ name, price });
      toast.success("Thêm topping thành công");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("Thêm topping thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm topping mới</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="font-medium">Tên topping</label>
          <Input
            placeholder="Tên topping"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="font-medium">Giá topping</label>
          <Input
            placeholder="Giá topping"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Thêm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
