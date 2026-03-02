import { useState } from "react";
import productService from "../../../../services/productService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";

export default function DeleteProduct({
  open,
  onClose,
  onSuccess,
  product,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      await productService.delete(product.id);

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Xóa sản phẩm thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Bạn có chắc chắn muốn xóa sản phẩm{" "}
            <span className="font-semibold">{product?.name}</span> không?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}