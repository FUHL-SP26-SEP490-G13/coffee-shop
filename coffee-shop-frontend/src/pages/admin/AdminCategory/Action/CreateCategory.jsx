import { useState, useEffect } from "react";
import categoryService from "../../../../services/categoryService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export default function CreateCategory({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setName("");
      setImage(null);
      setPreview(null);
    }
  }, [open]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      if (image) formData.append("image", image);

     // 👇 gọi API
    const res = await categoryService.create(formData);

    // 👇 thêm ngay vào UI
    onSuccess(res.data);

    // 👇 đóng modal ngay
    onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Thêm danh mục mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tên danh mục
            </label>
            <Input
              placeholder="Nhập tên danh mục..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Hình ảnh
            </label>

            {preview && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <Input type="file" onChange={handleImageChange} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo danh mục"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}