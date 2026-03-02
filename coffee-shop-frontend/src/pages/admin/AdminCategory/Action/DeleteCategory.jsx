import categoryService from "../../../../services/categoryService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";

export default function DeleteCategory({
  category,
  open,
  onClose,
  onSuccess,
}) {
  const handleDelete = async () => {
    await categoryService.delete(category.id);
    await onSuccess();
    onClose();
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa danh mục</DialogTitle>
        </DialogHeader>

        <p>Bạn có chắc muốn xóa "{category.name}"?</p>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}