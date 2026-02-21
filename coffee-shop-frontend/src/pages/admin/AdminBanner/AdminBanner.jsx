import { useEffect, useState } from "react";
import bannerService from "@/services/bannerService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Mail, Megaphone } from "lucide-react";

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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="mb-6 flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold mb-1">Quản lý banner</h1>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            setEditingBanner(null);
            setPreviewImage(null);
            setForm({ title: "", subtitle: "", image: null, is_active: true });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* TABLE */}
      <Card className="p-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Tìm theo tiêu đề..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 border">Ảnh</th>
                  <th className="p-3 border">Tiêu đề</th>
                  <th className="p-3 border">Active</th>
                  <th className="p-3 border">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 border">
                      <img
                        src={b.image_url}
                        className="w-24 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-3 border">{b.title}</td>
                    <td className="p-3 border text-center">
                      {b.is_active ? "✅" : "❌"}
                    </td>
                    <td className="p-3 border flex gap-2 justify-center">
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

                          // 👇 preview ảnh cũ
                          setPreviewImage(b.image_url);

                          setShowModal(true);
                        }}
                      >
                        Sửa
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>

          <span className="px-3 py-1">
            {page} / {totalPages || 1}
          </span>

          <Button
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner"}
            </h2>

            <Input
              placeholder="Tiêu đề"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <Input
              placeholder="Mô tả"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />

            <Input
              placeholder="Text nút (VD: Xem ngay)"
              value={form.button_text}
              onChange={(e) =>
                setForm({ ...form, button_text: e.target.value })
              }
            />

            <Input
              placeholder="Link nút (VD: /products)"
              value={form.button_link}
              onChange={(e) =>
                setForm({ ...form, button_link: e.target.value })
              }
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <label>Kích hoạt banner</label>
            </div>

            <input
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

            {previewImage && (
              <div className="mt-2">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded border"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit}>Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
