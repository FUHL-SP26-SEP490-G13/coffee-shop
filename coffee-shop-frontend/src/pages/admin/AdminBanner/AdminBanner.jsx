import { useEffect, useState } from "react";
import bannerService from "@/services/bannerService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Megaphone, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "",
    image: null,
    is_active: true,
  });

  const limit = 5;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await bannerService.getAll({
        page,
        limit,
        keyword,
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
  }, [page, keyword]);

  // ================= CREATE / UPDATE =================
  const handleSubmit = async () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("subtitle", form.subtitle);
    fd.append("is_active", form.is_active);
    fd.append("button_text", form.button_text);
    fd.append("button_link", form.button_link);
    fd.append("type", "banner");
    if (form.image) fd.append("image", form.image);

    try {
      if (editingBanner) {
        await bannerService.update(editingBanner.id, fd);
      } else {
        await bannerService.create(fd);
      }

      setShowModal(false);
      setEditingBanner(null);
      setForm({ title: "", subtitle: "", image: null, is_active: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa banner này?")) return;
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
          <h1 className="text-xl sm:text-2xl font-semibold">Quản lý banner</h1>
        </div>

        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => {
            setEditingBanner(null);
            setPreviewImage(null);
            setForm({ title: "", subtitle: "", button_text: "", button_link: "", image: null, is_active: true });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* TABLE */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
        ) : banners.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Không có banner nào</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Ảnh</th>
                    <th className="text-left py-3 px-4 font-medium">Tiêu đề</th>
                    <th className="text-left py-3 px-4 font-medium">Mô tả</th>
                    <th className="text-center py-3 px-4 font-medium">Trạng thái</th>
                    <th className="text-right py-3 px-4 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="w-24 h-12 object-cover rounded-md border"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">{b.title}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{b.subtitle || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant="secondary"
                          className={b.is_active 
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
                              setForm({
                                title: b.title,
                                subtitle: b.subtitle,
                                button_text: b.button_text || "",
                                button_link: b.button_link || "",
                                image: null,
                                is_active: b.is_active,
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
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner mới"}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? "Cập nhật thông tin banner" : "Thêm banner mới vào hệ thống"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề banner"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Mô tả</Label>
              <Input
                id="subtitle"
                placeholder="Nhập mô tả banner"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="button_text">Text nút</Label>
                <Input
                  id="button_text"
                  placeholder="VD: Xem ngay"
                  value={form.button_text}
                  onChange={(e) =>
                    setForm({ ...form, button_text: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_link">Link nút</Label>
                <Input
                  id="button_link"
                  placeholder="VD: /products"
                  value={form.button_link}
                  onChange={(e) =>
                    setForm({ ...form, button_link: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Trạng thái banner
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bật để hiển thị banner trên trang chủ
                </p>
              </div>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Ảnh banner</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm({ ...form, image: file });
                  if (file) {
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
              />
              {!editingBanner && <p className="text-xs text-muted-foreground">* Bắt buộc khi tạo mới</p>}
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
