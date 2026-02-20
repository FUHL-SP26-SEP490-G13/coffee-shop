import { useEffect, useState } from "react";
import bannerService from "@/services/bannerService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, ImagePlus } from "lucide-react";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    button_text: "",
    button_link: "",
    is_active: true,
  });

  const fetchData = async () => {
    try {
      const res = await bannerService.getAll();
      setBanners(res.data || []);
    } catch (err) {
      console.error(err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      await bannerService.create(form);
      setForm({
        title: "",
        subtitle: "",
        image_url: "",
        button_text: "",
        button_link: "",
        is_active: true,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (banner) => {
    await bannerService.update(banner.id, {
      ...banner,
      is_active: true,
    });
    fetchData();
  };

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý Banner</h1>

      {/* ===== CREATE FORM ===== */}
      <Card className="p-6 space-y-4">
        <h2 className="font-medium">Tạo banner mới</h2>

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
          placeholder="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />

        <Input
          placeholder="Text nút"
          value={form.button_text}
          onChange={(e) => setForm({ ...form, button_text: e.target.value })}
        />

        <Input
          placeholder="Link nút (vd: /news)"
          value={form.button_link}
          onChange={(e) => setForm({ ...form, button_link: e.target.value })}
        />

        <div className="flex items-center gap-3">
          <span>Active</span>
          <Switch
            checked={form.is_active}
            onCheckedChange={(value) => setForm({ ...form, is_active: value })}
          />
        </div>

        <Button onClick={handleSubmit} className="gap-2">
          <ImagePlus className="w-4 h-4" />
          Lưu banner
        </Button>
      </Card>

      {/* ===== LIST ===== */}
      <Card className="p-6">
        <h2 className="font-medium mb-4">Danh sách banner</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : banners.length === 0 ? (
          <p>Chưa có banner nào.</p>
        ) : (
          <div className="space-y-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between border p-4 rounded-lg"
              >
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.subtitle}</p>
                  {b.is_active && (
                    <span className="text-xs text-green-600 font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!b.is_active && (
                    <Button size="sm" onClick={() => handleActivate(b)}>
                      Kích hoạt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
