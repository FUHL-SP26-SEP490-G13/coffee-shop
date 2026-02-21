import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, Upload } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";

export default function AdminNewsCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    thumbnail: "",
    summary: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.title || !form.content) {
        alert("Vui lòng nhập tiêu đề và nội dung");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("content", form.content);
      formData.append("type", "news");
      formData.append("thumbnail", form.thumbnail);

      await newsService.create(formData);

      navigate("/admin/news-list");

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Tạo bài viết mới</h2>
          <p className="text-sm text-muted-foreground">Thêm bài viết tin tức mới vào hệ thống</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Hình ảnh đại diện *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setForm((prev) => ({
                    ...prev,
                    thumbnail: file,
                  }));

                  setPreview(URL.createObjectURL(file));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Chọn hình ảnh để tải lên</p>
              <p className="text-xs text-muted-foreground">Hỗ trợ JPG, PNG, WebP</p>
            </div>
          </div>

          {preview && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Xem trước hình ảnh:</p>
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-96 object-cover rounded-lg border border-border"
              />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Tóm tắt</Label>
            <Textarea
              id="summary"
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Nhập tóm tắt bài viết..."
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Nội dung *</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <RichTextEditor
                value={form.content}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    content: value,
                  }))
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Đang đăng..." : "Đăng bài"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/news-list")}
            >
              Hủy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
