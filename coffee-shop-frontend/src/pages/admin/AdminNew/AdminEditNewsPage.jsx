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

  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [existingImages, setExistingImages] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);

  const [newPreview, setNewPreview] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

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

        setExistingImages(data.images || []);
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
      formData.append("deleteImageIds", JSON.stringify(deleteIds));
      newFiles.forEach((file) => {
        formData.append("images", file);
      });

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
          <p className="text-sm text-muted-foreground">
            Cập nhật thông tin bài viết tin tức
          </p>
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

          {/* Images Upload */}
          <div className="space-y-2">
            <Label htmlFor="images">Hình ảnh bài viết</Label>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;

                  setNewFiles((prev) => [...prev, ...files]);

                  setNewPreview((prev) => [
                    ...prev,
                    ...files.map((file) => URL.createObjectURL(file)),
                  ]);

                  e.target.value = null; // cho phép chọn lại cùng file
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Chọn hình ảnh để tải lên</p>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ JPG, PNG, WebP
              </p>
            </div>
          </div>

          {newPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh mới:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {newPreview.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    className="w-full h-40 object-cover rounded-lg border"
                    alt={`new-${idx}`}
                  />
                ))}
              </div>
            </div>
          )}

          {existingImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh hiện tại:</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {existingImages.map((img) => {
                  const marked = deleteIds.includes(img.id);

                  return (
                    <div key={img.id} className="relative">
                      <img
                        src={img.image_url}
                        className={`w-full h-40 object-cover rounded-lg border ${
                          marked ? "opacity-40" : ""
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteIds((prev) =>
                            prev.includes(img.id)
                              ? prev.filter((x) => x !== img.id)
                              : [...prev, img.id]
                          );
                        }}
                        className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs"
                      >
                        {marked ? "Hoàn tác" : "Xóa"}
                      </button>
                    </div>
                  );
                })}
              </div>
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
