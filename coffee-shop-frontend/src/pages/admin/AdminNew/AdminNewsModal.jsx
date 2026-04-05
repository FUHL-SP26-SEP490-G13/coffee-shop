import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Newspaper, Sparkles } from "lucide-react";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import { toast } from "sonner";
import newsService from "@/services/newsService";
import { validateNewsForm } from "@/utils/newsValidation";

export default function AdminNewsModal({ isOpen, onClose, newsId, onSuccess }) {
  const isEditing = !!newsId;

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    tag: "",
    thumbnail: null,
    views: 0,
  });

  const [preview, setPreview] = useState(null); // For new uploaded file
  const [existingThumbnail, setExistingThumbnail] = useState(null); // For edit mode existing file
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiLoadingTitle, setAiLoadingTitle] = useState(false);
  const [aiLoadingSummary, setAiLoadingSummary] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errors, setErrors] = useState({});

  const titleDebounceRef = useRef(null);
  const summaryDebounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        fetchDetail();
      } else {
        setForm({
          title: "",
          summary: "",
          content: "",
          tag: "",
          thumbnail: null,
          views: 0,
        });
        setPreview(null);
        setExistingThumbnail(null);
        setErrors({});
        setUploadProgress(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, newsId]);

  const fetchDetail = async () => {
    try {
      setIsLoadingData(true);
      const res = await newsService.getById(newsId);
      const data = res.data?.data || res.data;

      setForm({
        title: data.title || "",
        summary: data.summary || "",
        content: data.content || "",
        tag: data.tag || "",
        thumbnail: data.thumbnail || "", // backend url
        views: data.views ?? 0,
      });
      setExistingThumbnail(data.thumbnail || null);
      setPreview(null);
      setErrors({});
    } catch (error) {
      console.error("Lỗi load bài:", error);
      toast.error("Không tải được chi tiết bài viết");
      onClose();
    } finally {
      setIsLoadingData(false);
    }
  };

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

  const handleThumbnailChange = (e) => {
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
    e.target.value = null; // reset input
  };

  const fetchAISuggestionByTitle = async (title) => {
    try {
      setAiLoadingTitle(true);
      const res = await newsService.suggestByTitle({ title });
      const data = res.data?.data || res.data;

      setForm((prev) => ({
        ...prev,
        tag: prev.tag?.trim() ? prev.tag : data?.tag || "",
        summary: prev.summary?.trim() ? prev.summary : data?.summary || "",
        content: prev.content?.trim() ? prev.content : data?.content || "",
      }));
    } catch (error) {
      console.error("AI suggest by title failed:", error);
      setErrors((prev) => ({
        ...prev,
        server: "Không thể lấy gợi ý AI từ tiêu đề",
      }));
    } finally {
      setAiLoadingTitle(false);
    }
  };

  const fetchAIContentBySummary = async (
    title,
    summary,
    forceReplace = false
  ) => {
    try {
      setAiLoadingSummary(true);
      const res = await newsService.suggestBySummary({ title, summary });
      const data = res.data?.data || res.data;

      setForm((prev) => ({
        ...prev,
        content:
          forceReplace || !prev.content?.trim()
            ? data?.content || ""
            : prev.content,
      }));
    } catch (error) {
      console.error("AI suggest by summary failed:", error);
      setErrors((prev) => ({
        ...prev,
        server: "Không thể lấy gợi ý nội dung từ tóm tắt",
      }));
    } finally {
      setAiLoadingSummary(false);
    }
  };

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
      if (preview) URL.revokeObjectURL(preview); // cleanup URL on unmount
    };
  }, [preview]);

  useEffect(() => {
    if (!isOpen) return;
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    const title = form.title.trim();
    if (title.length < 10) return;

    titleDebounceRef.current = setTimeout(() => {
      const shouldSuggest =
        !form.tag.trim() || !form.summary.trim() || !form.content.trim();
      if (shouldSuggest) {
        fetchAISuggestionByTitle(title);
      }
    }, 900);
    return () => clearTimeout(titleDebounceRef.current);
  }, [form.title, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
    const title = form.title.trim();
    const summary = form.summary.trim();

    if (title.length < 10 || summary.length < 10) return;
    if (form.content.trim()) return; // Don't overwrite if content exists

    summaryDebounceRef.current = setTimeout(() => {
      fetchAIContentBySummary(title, summary);
    }, 900);
    return () => clearTimeout(summaryDebounceRef.current);
  }, [form.summary, form.title, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuggestAgain = async () => {
    const title = form.title.trim();
    const summary = form.summary.trim();

    if (title.length < 10) {
      setErrors((prev) => ({ ...prev, title: "Tiêu đề phải có ít nhất 10 ký tự" }));
      return;
    }
    if (summary.length < 10) {
      setErrors((prev) => ({ ...prev, summary: "Tóm tắt phải có ít nhất 10 ký tự" }));
      return;
    }
    await fetchAIContentBySummary(title, summary, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateNewsForm(form, { requireThumbnail: !isEditing });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("summary", form.summary.trim());
      formData.append("content", form.content);
      formData.append("tag", form.tag.trim().toLowerCase());

      // Only append type when creating
      if (!isEditing) {
        formData.append("type", "news");
      }

      // If user uploaded a new file, it will be a File object
      // If editing and no new file, form.thumbnail is string (URL), no need to append
      if (form.thumbnail instanceof File) {
        formData.append("thumbnail", form.thumbnail);
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 0;
          if (!total) return;
          const percent = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percent);
        },
      };

      if (isEditing) {
        await newsService.update(newsId, formData, config);
        toast.success("Cập nhật bài viết thành công");
      } else {
        await newsService.create(formData, config);
        toast.success("Tạo bài viết thành công");
      }

      onSuccess();
      onClose();
    } catch (error) {
      const res = error.response?.data;
      if (res?.errors) {
        const backendErrors = {};
        res.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);

        const duplicatedTitleError = res.errors.find(
          (err) => err.field === "title" && err.message === "Tiêu đề bài viết đã tồn tại"
        );
        if (duplicatedTitleError) toast.error("Tiêu đề bài viết đã tồn tại");
      } else {
        setErrors((prev) => ({
          ...prev,
          server: res?.message || "Có lỗi xảy ra!",
        }));
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="title">Tiêu đề *</Label>
                {aiLoadingTitle && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI đang gợi ý từ tiêu đề...
                  </span>
                )}
              </div>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề bài viết..."
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Tag *</Label>
              <Input
                id="tag"
                name="tag"
                value={form.tag}
                onChange={handleChange}
                placeholder="Ví dụ: #vanct"
              />
              {errors.tag && <p className="text-sm text-red-500">{errors.tag}</p>}
            </div>

            {form.tag && (
              <div className="pt-0.5">
                <span className="text-xs text-muted-foreground mr-2">Preview:</span>
                <span className="px-2 py-1 text-xs rounded bg-secondary capitalize">
                  {form.tag}
                </span>
              </div>
            )}

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="views">Lượt xem</Label>
                <Input id="views" name="views" value={form.views ?? 0} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Hình ảnh bài viết {!isEditing && "*"}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer relative">
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Chọn hình ảnh để tải lên</p>
                <p className="text-xs text-muted-foreground">Hỗ trợ JPG, PNG, WebP</p>
              </div>
              {errors.thumbnail && <p className="text-sm text-red-500">{errors.thumbnail}</p>}
            </div>

            {preview && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Ảnh mới:</p>
                <div className="flex justify-center">
                  <img
                    src={preview}
                    className="max-h-72 max-w-xl w-full object-cover rounded-xl border border-border shadow-sm"
                    alt="Preview"
                  />
                </div>
              </div>
            )}

            {isEditing && existingThumbnail && !preview && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Ảnh hiện tại:</p>
                <div className="flex justify-center">
                  <img
                    src={existingThumbnail}
                    className="max-h-72 max-w-xl w-full object-cover rounded-xl border border-border shadow-sm"
                    alt="Current Thumbnail"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="summary">Tóm tắt *</Label>
                {aiLoadingSummary && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI đang tạo nội dung từ tóm tắt...
                  </span>
                )}
              </div>
              <Textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="Nhập tóm tắt bài viết..."
                rows={3}
              />
              {errors.summary && <p className="text-sm text-red-500">{errors.summary}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Nội dung *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestAgain}
                  disabled={
                    aiLoadingSummary ||
                    form.title.trim().length < 10 ||
                    form.summary.trim().length < 10
                  }
                >
                  {aiLoadingSummary ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Gợi ý lại bằng AI
                </Button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <RichTextEditor
                  value={form.content}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, content: value }));
                    setErrors((prev) => ({ ...prev, content: "", server: "" }));
                  }}
                />
              </div>
              {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
            </div>

            {errors.server && <p className="text-sm text-red-500">{errors.server}</p>}

            {submitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{uploadProgress > 0 ? "Đang tải ảnh..." : "Đang lưu dữ liệu..."}</span>
                  <span>{uploadProgress > 0 ? `${uploadProgress}%` : "Vui lòng chờ"}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: uploadProgress > 0 ? `${uploadProgress}%` : "50%" }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : isEditing ? (
                  "Cập nhật"
                ) : (
                  "Đăng bài"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
