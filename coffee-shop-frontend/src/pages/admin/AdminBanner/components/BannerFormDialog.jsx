import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function BannerFormDialog({
  open,
  onOpenChange,
  editingBanner,
  form,
  setForm,
  previewImage,
  setPreviewImage,
  errors,
  setErrors,
  handleChange,
  handleSubmit,
  submitting,
  uploadProgress,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBanner ? "Chỉnh sửa quảng cáo" : "Tạo quảng cáo mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Nhập tiêu đề quảng cáo"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Mô tả *</Label>
            <Input
              id="subtitle"
              name="subtitle"
              placeholder="Nhập mô tả quảng cáo"
              value={form.subtitle}
              onChange={handleChange}
            />
            {errors.subtitle && (
              <p className="text-sm text-red-500">{errors.subtitle}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_text">Text nút *</Label>
            <Input
              id="button_text"
              name="button_text"
              placeholder="VD: Xem ngay"
              value={form.button_text}
              onChange={handleChange}
            />
            {errors.button_text && (
              <p className="text-sm text-red-500">{errors.button_text}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_link">Link nút *</Label>
            <Input
              id="button_link"
              name="button_link"
              placeholder="VD: /products hoặc https://example.com"
              value={form.button_link}
              onChange={handleChange}
            />
            {errors.button_link && (
              <p className="text-sm text-red-500">{errors.button_link}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Ngày bắt đầu *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Ngày kết thúc *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Ảnh quảng cáo</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;

                setForm((prev) => ({
                  ...prev,
                  image: file,
                }));

                if (file) {
                  setPreviewImage(URL.createObjectURL(file));
                }

                setErrors((prev) => ({
                  ...prev,
                  image: "",
                  server: "",
                }));
              }}
            />

            {errors.image && (
              <p className="text-sm text-red-500">{errors.image}</p>
            )}

            {!editingBanner && (
              <p className="text-xs text-muted-foreground">
                * Bắt buộc khi tạo mới
              </p>
            )}
          </div>

          {previewImage && (
            <div className="space-y-2">
              <Label>Xem trước ảnh</Label>
              <div className="w-full h-48 md:h-64 rounded-lg border bg-muted flex items-center justify-center p-2">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {errors.server && (
            <p className="text-sm text-red-500">{errors.server}</p>
          )}
        </div>

        {submitting && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Đang tải ảnh lên...</span>
              <span>{uploadProgress}%</span>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting
              ? "Đang lưu..."
              : editingBanner
              ? "Cập nhật"
              : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
