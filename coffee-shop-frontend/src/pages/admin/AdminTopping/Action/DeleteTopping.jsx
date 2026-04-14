import { toast } from 'sonner';
import toppingService from '../../../../services/toppingService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';

export default function DeleteTopping({ open, onClose, onSuccess, topping }) {
  const handleDelete = async () => {
    if (!topping?.id) {
      toast.error('Không tìm thấy topping');
      return;
    }
    try {
      await toppingService.delete(topping.id);
      toast.success('Xóa topping thành công');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Xóa topping thất bại');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa topping</DialogTitle>
        </DialogHeader>
        <div className="py-4">Bạn có chắc muốn xóa topping <span className='font-semibold text-foreground'>{topping?.name}</span>?</div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
