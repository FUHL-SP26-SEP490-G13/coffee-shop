import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft, Upload, Newspaper } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import { validateNewsForm } from "@/utils/newsValidation";

export default function AdminNewsCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    tag: "",
    thumbnail: null,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      server: "",
    }));
  };

  const handleSubmit = async () => {
    const newErrors = validateNewsForm(form, { requireThumbnail: true });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("summary", form.summary.trim());
      formData.append("content", form.content);
      formData.append("type", "news");
      formData.append("tag", form.tag.trim().toLowerCase());
      formData.append("thumbnail", form.thumbnail);

      await newsService.create(formData);

      navigate("/admin/news-list");
    } catch (error) {
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else if (error.response?.data?.message) {
        setErrors((prev) => ({
          ...prev,
          server: error.response.data.message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          server: "Có lỗi xảy ra!",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/news-list")}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-lg mb-1">Tạo bài viết mới</span>
            <p className="text-sm text-muted-foreground mt-1">
              Chia sẻ thông tin hữu ích cho mọi người
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề bài viết..."
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Input
              id="tag"
              name="tag"
              value={form.tag}
              onChange={handleChange}
              placeholder="Ví dụ: #vanct..."
            />
            {errors.tag && <p className="text-sm text-red-500">{errors.tag}</p>}
          </div>

          {form.tag && (
            <div className="pt-2">
              <span className="text-xs text-muted-foreground mr-2">
                Preview:
              </span>
              <span className="px-2 py-1 text-xs rounded bg-secondary capitalize">
                {form.tag}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Hình ảnh bài viết</Label>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setForm((prev) => ({
                    ...prev,
                    thumbnail: file,
                  }));

                  setPreview(URL.createObjectURL(file));

                  setErrors((prev) => ({
                    ...prev,
                    thumbnail: "",
                    server: "",
                  }));

                  e.target.value = null;
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Chọn hình ảnh để tải lên</p>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ JPG, PNG, WebP
              </p>
            </div>

            {errors.thumbnail && (
              <p className="text-sm text-red-500">{errors.thumbnail}</p>
            )}
          </div>

          {preview && (
            <div className="mt-4 flex justify-center">
              <img
                src={preview}
                className="max-h-48 w-auto object-contain rounded-lg border"
                alt="Preview"
              />
            </div>
          )}

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
            {errors.summary && (
              <p className="text-sm text-red-500">{errors.summary}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nội dung *</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <RichTextEditor
                value={form.content}
                onChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    content: value,
                  }));

                  setErrors((prev) => ({
                    ...prev,
                    content: "",
                    server: "",
                  }));
                }}
              />
            </div>
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {errors.server && (
            <p className="text-sm text-red-500">{errors.server}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
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
