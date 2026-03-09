import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import areaService from "@/services/areaService";

export default function AreaModal({ isOpen, onClose, area, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || "",
      });
      setImagePreview(area.image || "");
      setImageFile(null);
    } else {
      setFormData({
        name: "",
      });
      setImagePreview("");
      setImageFile(null);
    }
    setErrors({});
  }, [area, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tên khu vực là bắt buộc";
    } else if (formData.name.length < 2) {
      newErrors.name = "Tên khu vực phải có ít nhất 2 ký tự";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append("name", formData.name);
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      if (area) {
        await areaService.update(area.id, submitData);
        toast.success("Cập nhật khu vực thành công");
      } else {
        await areaService.create(submitData);
        toast.success("Thêm khu vực thành công");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{area ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          {/* IMAGE UPLOAD SECTION */}
          <div className="space-y-2">
            <Label>Hình ảnh khu vực (Tuỳ chọn)</Label>
            <div className="flex flex-col items-center justify-center gap-4">
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" /> Gỡ ảnh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <Label
                    htmlFor="area-image"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Tải ảnh lên</span> hoặc kéo thả vào đây
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP lên đến 5MB</p>
                    </div>
                    <Input
                      id="area-image"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="name">Tên khu vực</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Tầng 1, Sân sau..."
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : area ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
