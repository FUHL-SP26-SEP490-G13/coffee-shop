import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, Upload } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";

export default function AdminEditNewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await newsService.getById(id);
        const data = res.data?.data || res.data;

        setForm({
          title: data.title,
          summary: data.summary,
          content: data.content,
        });

        setPreview(data.thumbnail);
      } catch (error) {
        console.error("Lỗi load bài:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("content", form.content);

      formData.append("type", "news");
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      await newsService.update(id, formData);
      navigate("/admin/news-list");

    } catch (error) {
      alert("Cập nhật thất bại");
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Chỉnh sửa bài viết</h2>
          <p className="text-sm text-muted-foreground">Cập nhật thông tin bài viết tin tức</p>
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

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Hình ảnh đại diện</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setThumbnailFile(file);
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
              <p className="text-sm font-medium">Hình ảnh hiện tại:</p>
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
