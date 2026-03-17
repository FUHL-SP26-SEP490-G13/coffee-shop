import { useState } from 'react';
import { toast } from 'sonner';
import categoryService from '../../../../services/categoryService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteCategory({
  category,
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await categoryService.delete(category.id);

      // ✅ Kiểm tra response từ BE
      if (response.success) {
        toast.success(response.message || 'Xóa danh mục thành công!');

        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      
      // ✅ Lấy message từ BE
      const errorMessage = 
        err.response?.data?.message || 
        err.message ||
        'Có lỗi xảy ra khi xóa danh mục';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Xóa danh mục
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          Bạn có chắc chắn muốn xóa danh mục{' '}
          <span className="font-semibold">"{category.name}"</span>?
        </p>

        <div className='flex justify-end gap-2 mt-4'>
          <Button 
            variant='outline' 
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            variant='destructive' 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}