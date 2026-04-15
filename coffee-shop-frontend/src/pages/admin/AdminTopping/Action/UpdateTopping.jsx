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
  const [categoryIds, setCategoryIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        if (res.data) setCategories(res.data.filter(c => c.is_deleted === 0));
      } catch (err) {}
    };
    if (open) fetchCategories();
  }, [open]);

  useEffect(() => {
    if (topping) {
      setName(topping.name || '');
      setPrice(topping.price || '');
      setCategoryIds(topping.category_ids ? (typeof topping.category_ids === 'string' ? JSON.parse(topping.category_ids) : topping.category_ids) : []);
    }
  }, [topping, open]);

  const handleSubmit = async () => {
    if (!name || !price) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    try {
      await toppingService.update(topping.id, { name, price, category_ids: categoryIds });
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
          <div className="flex flex-col gap-1">
            <Input placeholder="Giá topping" type="number" value={price} onChange={e => setPrice(e.target.value)} />
            {price && !isNaN(Number(price)) && (
              <p className="text-sm text-green-600 font-medium">
                ~ {Number(price).toLocaleString("vi-VN")} đ
              </p>
            )}
          </div>
          <label className="font-medium text-sm">Kiểu đồ uống áp dụng</label>
          <div className="max-h-40 overflow-y-auto border p-3 rounded-md space-y-2">
             {categories.length === 0 ? (
               <span className="text-gray-400 text-sm">Chưa có danh mục...</span>
             ) : (
               categories.map(c => (
                 <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                   <input
                     type="checkbox"
                     checked={categoryIds.includes(c.id)}
                     onChange={(e) => {
                       if (e.target.checked) setCategoryIds([...categoryIds, c.id]);
                       else setCategoryIds(categoryIds.filter(id => id !== c.id));
                     }}
                     className="w-4 h-4 shrink-0"
                   />
                   {c.image_url && <img src={c.image_url} alt={c.name} className="w-6 h-6 object-cover rounded-md flex-shrink-0 border border-gray-200" />}
                   <span className="flex-1">{c.name} - {c.code}</span>
                 </label>
               ))
             )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting}>Cập nhật</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
