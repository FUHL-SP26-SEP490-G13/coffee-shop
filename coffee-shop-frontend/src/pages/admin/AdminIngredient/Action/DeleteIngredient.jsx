import { useState } from 'react';
import { toast } from 'sonner';
import ingredientService from '../../../../services/ingredientService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';

export default function DeleteIngredient({ ingredient, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!ingredient?.id) return;

    try {
      setLoading(true);
      const response = await ingredientService.delete(ingredient.id);

      if (response.success) {
        toast.success(response.message || 'Xóa nguyên liệu thành công!');
        if (onSuccess) onSuccess(ingredient.id);
        onClose();
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa nguyên liệu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa nguyên liệu</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa nguyên liệu{' '}
            <span className='font-semibold text-foreground'>
              "{ingredient?.name}"
            </span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className='bg-red-600 hover:bg-red-700'
          >
            {loading ? 'Đang xóa...' : 'Xóa nguyên liệu'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
