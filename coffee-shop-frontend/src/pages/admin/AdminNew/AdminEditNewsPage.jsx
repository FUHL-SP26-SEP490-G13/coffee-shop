import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, Upload } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import {
  validateNewsForm,
  validateNewsField,
  stripHtml,
  NEWS_RULES,
} from "@/utils/newsValidation";

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

  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [newPreview, setNewPreview] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [errors, setErrors] = useState({});

  const getCountText = (current, min) => `${current}/${min}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await newsService.getById(id);
        const data = res.data?.data || res.data;

        setForm({
          title: data.title,
          summary: data.summary,
          content: data.content,
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

  const validate = () => {
    const newErrors = validateNewsForm(form, { requireThumbnail: false });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateNewsField(name, value),
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("summary", form.summary.trim());
      formData.append("content", form.content);
      formData.append("tag", form.tag.trim().toLowerCase());

      if (newFiles.length > 0) {
        formData.append("thumbnail", newFiles[0]);
      }

      await newsService.update(id, formData);

      navigate("/admin/news-list");
    } catch (error) {
      const res = error.response?.data;

      if (res?.errors) {
        const serverErrors = {};

        res.errors.forEach((err) => {
          serverErrors[err.field] = err.message;
        });

        setErrors(serverErrors);
      } else {
        setErrors((prev) => ({
          ...prev,
          server: res?.message || "Có lỗi xảy ra",
        }));
      }
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mb-6 flex items-center justify-between">
        <h4 className="text-2xl font-semibold">Chỉnh sửa bài viết</h4>

        <Button
          variant="outline"
          size="sm"
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

          <div className="flex items-center justify-between">
            {errors.title ? (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {form.title.trim().length > 0 &&
                  `Tiến độ: ${form.title.trim().length}/${
                    NEWS_RULES.TITLE_MIN
                  }`}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {form.title.length}/{NEWS_RULES.TITLE_MAX}
            </p>
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
              <p className="text-red-500 text-sm mt-1">{errors.tag}</p>
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
            <Input
              id="views"
              name="views"
              value={form.views ?? 0}
              disabled // không cho edit
            />
          </div>

          {/* Images Upload */}
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

                  setNewFiles([file]);
                  setNewPreview([URL.createObjectURL(file)]);

                  setErrors((prev) => ({
                    ...prev,
                    thumbnail: "",
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
              <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
            )}
          </div>

          {newPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh mới:</p>
              <div className="flex justify-center">
                {newPreview.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    className="w-64 h-40 object-cover rounded-lg border"
                    alt={`new-${idx}`}
                  />
                ))}
              </div>
            </div>
          )}

          {form.thumbnail && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh hiện tại:</p>
              <div className="flex justify-center">
                <img
                  src={form.thumbnail}
                  className="w-64 h-40 object-cover rounded-lg border"
                  alt="thumbnail"
                />
              </div>
              {errors.thumbnail && (
                <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
              )}
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

          <div className="flex items-center justify-between">
            {errors.summary ? (
              <p className="text-sm text-red-500">{errors.summary}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {form.summary.trim().length > 0 &&
                  `Tiến độ: ${getCountText(
                    form.summary.trim().length,
                    NEWS_RULES.SUMMARY_MIN
                  )}`}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {form.summary.length}/{NEWS_RULES.SUMMARY_MAX}
            </p>
          </div>

          {/* Content */}
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
                    content: validateNewsField("content", value),
                  }));
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            {errors.content ? (
              <p className="text-sm text-red-500">{errors.content}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {stripHtml(form.content).length > 0 &&
                  `Tiến độ: ${getCountText(
                    stripHtml(form.content).length,
                    NEWS_RULES.CONTENT_MIN
                  )}`}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {stripHtml(form.content).length}/{NEWS_RULES.CONTENT_MAX}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
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
