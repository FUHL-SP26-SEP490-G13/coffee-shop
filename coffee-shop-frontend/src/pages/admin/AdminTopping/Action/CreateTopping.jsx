import { useState } from "react";
import { toast } from "sonner";
import toppingService from "../../../../services/toppingService";
import categoryService from "../../../../services/categoryService";
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
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.data) setCategories(res.data);
      } catch (err) {}
    };
    if (open) fetchCategories();
  }, [open]);

  const uniqueTypes = [...new Set(categories.map(c => c.type).filter(Boolean))];

  const handleSubmit = async () => {
    if (!name || !price) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await toppingService.create({ name, price, type: type || null });
      toast.success("Thêm topping thành công");
      onSuccess?.();
      onClose();
      setType("");
      setName("");
      setPrice("");
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
          <label className="font-medium">Loại Topping (theo Category Type)</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">-- Không chọn --</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
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
