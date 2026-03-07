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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  validateBannerForm,
  validateBannerField,
  BANNER_RULES,
} from "@/utils/bannerValidation";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});

  const [status, setStatus] = useState("");

  const getCountText = (current, min) => `${current}/${min}`;

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "",
    image: null,
    is_active: true,
  });

  const limit = 5;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateBannerField(name, value),
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await bannerService.getAll({
        page,
        limit,
        keyword,
        status,
      });

      setBanners(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, keyword, status]);

  // ================= CREATE / UPDATE =================
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
      fd.append("is_active", form.is_active);
      fd.append("button_text", form.button_text.trim());
      fd.append("button_link", form.button_link.trim());
      fd.append("type", "banner");

      if (form.image) fd.append("image", form.image);

      if (editingBanner) {
        await bannerService.update(editingBanner.id, fd);
      } else {
        await bannerService.create(fd);
      }

      setShowModal(false);
      setEditingBanner(null);
      setPreviewImage(null);
      setErrors({});
      setForm({
        title: "",
        subtitle: "",
        button_text: "",
        button_link: "",
        image: null,
        is_active: true,
      });

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
  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) return;
    await bannerService.delete(id);
    fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-semibold">
            Quản lý quảng cáo
          </h1>
        </div>

        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => {
            setEditingBanner(null);
            setPreviewImage(null);
            setErrors({});
            setForm({
              title: "",
              subtitle: "",
              button_text: "",
              button_link: "",
              image: null,
              is_active: true,
            });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* TABLE */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
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
                    <th className="text-left py-3 px-4 font-medium">Mô tả</th>
                    <th className="text-center py-3 px-4 font-medium">
                      Trạng thái
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => (
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
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {b.subtitle || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="secondary"
                          className={
                            b.is_active
                              ? "bg-green-500/10 text-green-700 border-green-500/20"
                              : "bg-red-500/10 text-red-700 border-red-500/20"
                          }
                        >
                          {b.is_active ? "Active" : "Inactive"}
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
                                title: b.title,
                                subtitle: b.subtitle,
                                button_text: b.button_text || "",
                                button_link: b.button_link || "",
                                image: null,
                                is_active: !!b.is_active,
                              });
                              setPreviewImage(b.image_url);
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGINATION */}
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

      {/* MODAL */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);

          if (!open) {
            setErrors({});
            setEditingBanner(null);
            setPreviewImage(null);
            setForm({
              title: "",
              subtitle: "",
              button_text: "",
              button_link: "",
              image: null,
              is_active: true,
            });
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Chỉnh sửa quảng cáo" : "Tạo quảng cáo mới"}
            </DialogTitle>
            {/* <DialogDescription>
              {editingBanner
                ? "Cập nhật thông tin banner"
                : "Thêm banner mới vào hệ thống"}
            </DialogDescription> */}
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
            </div>

            <div className="flex items-center justify-between">
              {errors.title ? (
                <p className="text-sm text-red-500">{errors.title}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {form.title.trim().length > 0 &&
                    `Tiến độ: ${getCountText(
                      form.title.trim().length,
                      BANNER_RULES.TITLE_MIN
                    )}`}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {form.title.length}/{BANNER_RULES.TITLE_MAX}
              </p>
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
            </div>

            <div className="flex items-center justify-between">
              {errors.subtitle ? (
                <p className="text-sm text-red-500">{errors.subtitle}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {form.subtitle.trim().length > 0 &&
                    `Tiến độ: ${getCountText(
                      form.subtitle.trim().length,
                      BANNER_RULES.SUBTITLE_MIN
                    )}`}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {form.subtitle.length}/{BANNER_RULES.SUBTITLE_MAX}
              </p>
            </div>

            {/* <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="button_text">Text nút *</Label>
                <Input
                  id="button_text"
                  name="button_text"
                  placeholder="VD: Xem ngay"
                  value={form.button_text}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-between">
                {errors.button_text ? (
                  <p className="text-sm text-red-500">{errors.button_text}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {form.button_text.trim().length > 0 &&
                      `Tiến độ: ${getCountText(
                        form.button_text.trim().length,
                        BANNER_RULES.BUTTON_TEXT_MIN
                      )}`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {form.button_text.length}/{BANNER_RULES.BUTTON_TEXT_MAX}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_link">Link nút *</Label>
                <Input
                  id="button_link"
                  name="button_link"
                  placeholder="VD: /products"
                  value={form.button_link}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-between">
                {errors.button_link ? (
                  <p className="text-sm text-red-500">{errors.button_link}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {form.button_link.trim().length > 0 &&
                      `Tiến độ: ${getCountText(
                        form.button_link.trim().length,
                        BANNER_RULES.BUTTON_LINK_MIN
                      )}`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {form.button_link.length}/{BANNER_RULES.BUTTON_LINK_MAX}
                </p>
              </div>
            </div> */}
            <div className="space-y-4">
              <div>
                <div className="space-y-2">
                  <Label htmlFor="button_text">Text nút *</Label>
                  <Input
                    id="button_text"
                    name="button_text"
                    placeholder="VD: Xem ngay"
                    value={form.button_text}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  {errors.button_text ? (
                    <p className="text-sm text-red-500">{errors.button_text}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {form.button_text.trim().length > 0 &&
                        `Tiến độ: ${getCountText(
                          form.button_text.trim().length,
                          BANNER_RULES.BUTTON_TEXT_MIN
                        )}`}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {form.button_text.length}/{BANNER_RULES.BUTTON_TEXT_MAX}
                  </p>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">Link nút *</Label>
                  <Input
                    id="button_link"
                    name="button_link"
                    placeholder="VD: /products"
                    value={form.button_link}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  {errors.button_link ? (
                    <p className="text-sm text-red-500">{errors.button_link}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {form.button_link.trim().length > 0 &&
                        `Tiến độ: ${getCountText(
                          form.button_link.trim().length,
                          BANNER_RULES.BUTTON_LINK_MIN
                        )}`}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {form.button_link.length}/{BANNER_RULES.BUTTON_LINK_MAX}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Trạng thái quảng cáo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bật để hiển thị quảng cáo trên trang chủ
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
            </div>

            {errors.is_active && (
              <p className="text-sm text-red-500">{errors.is_active}</p>
            )}

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
                    image: validateBannerField("image", file, {
                      required: !editingBanner,
                    }),
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
                <Label>Xem trước</Label>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
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
