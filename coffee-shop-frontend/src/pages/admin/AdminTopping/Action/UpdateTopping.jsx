import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import toppingService from '../../../../services/toppingService';
import categoryService from '../../../../services/categoryService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

export default function UpdateTopping({ open, onClose, onSuccess, topping }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
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

  useEffect(() => {
    if (topping) {
      setName(topping.name || '');
      setPrice(topping.price || '');
      setType(topping.type || '');
    }
  }, [topping]);

  const handleSubmit = async () => {
    if (!name || !price) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    try {
      await toppingService.update(topping.id, { name, price, type: type || null });
      toast.success('Cập nhật topping thành công');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Cập nhật topping thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật topping</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input placeholder="Tên topping" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Giá topping" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">-- Chọn loại Topping (tùy chọn) --</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting}>Cập nhật</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
