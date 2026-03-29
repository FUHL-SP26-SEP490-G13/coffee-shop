import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import appSettingService from "@/services/appSettingService";
import { Settings, Save, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Store setting states
  const [settings, setSettings] = useState({
    weekday_open: "07:00",
    weekday_close: "22:30",
    weekend_open: "07:30",
    weekend_close: "23:00",
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await appSettingService.getSettings();
      if (res?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await appSettingService.upsertSettings(settings);
      toast.success("Đã cập nhật cài đặt thành công");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Cập nhật cài đặt thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <div className="p-6">Đang tải cấu hình...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-1">Cài đặt chung</h2>
            <p className="text-sm text-muted-foreground">
              Cấu hình các thông số hoạt động của hệ thống
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khung Giờ Hoạt Động */}
        <Card className="p-6 shadow-sm border-border">
          <div className="flex gap-2 items-center mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Giờ Hoạt Động</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary/30 p-4 rounded-lg border border-border">
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wide">
                Thứ 2 - Thứ 6
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    name="weekday_open"
                    value={settings.weekday_open || ""}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    name="weekday_close"
                    value={settings.weekday_close || ""}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg border border-border">
              <h4 className="font-medium mb-4 text-sm uppercase tracking-wide">
                Thứ 7 - Chủ Nhật
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    name="weekend_open"
                    value={settings.weekend_open || ""}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    name="weekend_close"
                    value={settings.weekend_close || ""}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* You can add more cards here for future settings: 
            e.g., Support Links, Delivery Fee Config, etc. */}
      </div>
    </div>
  );
}
