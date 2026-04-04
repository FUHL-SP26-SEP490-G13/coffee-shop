import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, Upload, Newspaper } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import { validateNewsForm } from "@/utils/newsValidation";
import { toast } from "sonner";

export default function AdminEditNewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    tag: "",
    thumbnail: "",
    views: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [newPreview, setNewPreview] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await newsService.getById(id);
        const data = res.data?.data || res.data;

        setForm({
          title: data.title || "",
          summary: data.summary || "",
          content: data.content || "",
          tag: data.tag || "",
          thumbnail: data.thumbnail || "",
          views: data.views ?? 0,
        });
      } catch (error) {
        console.error("Lỗi load bài:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

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
    const newErrors = validateNewsForm(
      {
        ...form,
        thumbnail: newFile || form.thumbnail,
      },
      { requireThumbnail: false }
    );

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("summary", form.summary.trim());
      formData.append("content", form.content);
      formData.append("tag", form.tag.trim().toLowerCase());

      if (newFile) {
        formData.append("thumbnail", newFile);
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 0;
          if (!total) return;

          const percent = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percent);
        },
      };
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await newsService.update(id, formData, config);

      toast.success("Cập nhật bài viết thành công");
      navigate("/admin/news-list");
    } catch (error) {
      const res = error.response?.data;

      if (res?.errors) {
        const serverErrors = {};

        res.errors.forEach((err) => {
          serverErrors[err.field] = err.message;
        });

        setErrors(serverErrors);

        const duplicatedTitleError = res.errors.find(
          (err) =>
            err.field === "title" &&
            err.message === "Tiêu đề bài viết đã tồn tại"
        );

        if (duplicatedTitleError) {
          toast.error("Tiêu đề bài viết đã tồn tại");
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          server: res?.message || "Có lỗi xảy ra",
        }));
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="w-full">
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
            <div>
              <span className="text-md">Chỉnh sửa bài viết</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 w-full">
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
                <p className="text-red-500 text-sm">{errors.title}</p>
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
              {errors.tag && (
                <p className="text-red-500 text-sm">{errors.tag}</p>
              )}
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
              <Label htmlFor="views">Lượt xem</Label>
              <Input id="views" name="views" value={form.views ?? 0} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Hình ảnh bài viết</Label>

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setNewFile(file);
                    setNewPreview(URL.createObjectURL(file));

                    setErrors((prev) => ({
                      ...prev,
                      thumbnail: "",
                      server: "",
                    }));
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
                <p className="text-red-500 text-sm">{errors.thumbnail}</p>
              )}
            </div>

            {newPreview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ảnh mới:</p>
                <div className="flex justify-center">
                  <img
                    src={newPreview}
                    className="w-64 h-40 object-cover rounded-lg border"
                    alt="new-thumbnail"
                  />
                </div>
              </div>
            )}

            {form.thumbnail && !newPreview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ảnh hiện tại:</p>
                <div className="flex justify-center">
                  <img
                    src={form.thumbnail}
                    className="w-64 h-40 object-cover rounded-lg border"
                    alt="thumbnail"
                  />
                </div>
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

            {submitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {uploadProgress > 0
                      ? "Đang tải ảnh..."
                      : "Đang lưu dữ liệu..."}
                  </span>
                  <span>
                    {uploadProgress > 0 ? `${uploadProgress}%` : "Vui lòng chờ"}
                  </span>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{
                      width: uploadProgress > 0 ? `${uploadProgress}%` : "50%",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/news-list")}
                disabled={submitting}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
