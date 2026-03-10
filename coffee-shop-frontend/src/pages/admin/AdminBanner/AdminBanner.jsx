import { useEffect, useState } from "react";
import bannerService from "@/services/bannerService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Megaphone,
  Edit2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { validateBannerForm } from "@/utils/bannerValidation";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "",
    image: null,
    start_date: "",
    end_date: "",
  });

  const limit = 5;

  const resetForm = () => {
    setEditingBanner(null);
    setPreviewImage(null);
    setErrors({});
    setForm({
      title: "",
      subtitle: "",
      button_text: "",
      button_link: "",
      image: null,
      start_date: "",
      end_date: "",
    });
  };

  const toDatetimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getBannerStatus = (banner) => {
    const now = new Date();
    const start = new Date(banner.start_date);
    const end = new Date(banner.end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        text: "Không hợp lệ",
        className: "bg-red-500/10 text-red-700 border-red-500/20",
      };
    }

    if (now < start) {
      return {
        text: "Chưa bắt đầu",
        className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      };
    }

    if (now > end) {
      return {
        text: "Đã kết thúc",
        className: "bg-red-500/10 text-red-700 border-red-500/20",
      };
    }

    return {
      text: "Đang hoạt động",
      className: "bg-green-500/10 text-green-700 border-green-500/20",
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await bannerService.getAll({
        page,
        limit,
        keyword,
        status,
      });

      setBanners(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Lỗi load banner:", err);
      setError("Không thể tải danh sách banner");
      setBanners([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, keyword, status]);

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
    const newErrors = validateBannerForm(form, {
      requireImage: !editingBanner,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", form.subtitle.trim());
      fd.append("button_text", form.button_text.trim());
      fd.append("button_link", form.button_link.trim());
      fd.append("start_date", form.start_date);
      fd.append("end_date", form.end_date);
      fd.append("type", "banner");

      if (form.image) {
        fd.append("image", form.image);
      }

      if (editingBanner) {
        await bannerService.update(editingBanner.id, fd);
      } else {
        await bannerService.create(fd);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setErrors(backendErrors);
      } else if (err.response?.data?.message) {
        setErrors((prev) => ({
          ...prev,
          server: err.response.data.message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          server: "Có lỗi xảy ra!",
        }));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) return;

    try {
      await bannerService.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (error && banners.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>

        <Button variant="outline" className="mt-4" onClick={fetchData}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-1">Quản lý quảng cáo</h2>
            <p className="text-sm text-muted-foreground">
              Truyền bá cửa hàng của bạn nào
            </p>
          </div>
        </div>

        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Còn hạn</option>
            <option value="upcoming">Chưa diễn ra</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
        ) : banners.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Không có banner nào
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Ảnh</th>
                    <th className="text-left py-3 px-4 font-medium">Tiêu đề</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Thời gian
                    </th>
                    <th className="text-center py-3 px-4 font-medium">
                      Trạng thái
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => {
                    const bannerStatus = getBannerStatus(b);

                    return (
                      <tr
                        key={b.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <img
                            src={b.image_url}
                            alt={b.title}
                            className="w-24 h-12 object-cover rounded-md border"
                          />
                        </td>

                        <td className="py-3 px-4">{b.title}</td>

                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          <div>
                            <div>
                              Bắt đầu:{" "}
                              {toDatetimeLocal(b.start_date).replace("T", " ")}
                            </div>
                            <div>
                              Kết thúc:{" "}
                              {toDatetimeLocal(b.end_date).replace("T", " ")}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant="secondary"
                            className={bannerStatus.className}
                          >
                            {bannerStatus.text}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingBanner(b);
                                setErrors({});
                                setForm({
                                  title: b.title || "",
                                  subtitle: b.subtitle || "",
                                  button_text: b.button_text || "",
                                  button_link: b.button_link || "",
                                  image: null,
                                  start_date: toDatetimeLocal(b.start_date),
                                  end_date: toDatetimeLocal(b.end_date),
                                });
                                setPreviewImage(b.image_url || null);
                                setShowModal(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Sửa</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(b.id)}
                            >
                              <Trash2 className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Xóa</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 sm:w-10 sm:h-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="subtitle">Mô tả</Label>
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
              <Label htmlFor="button_text">Text nút</Label>
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
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            {errors.server && (
              <p className="text-sm text-red-500">{errors.server}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingBanner ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
