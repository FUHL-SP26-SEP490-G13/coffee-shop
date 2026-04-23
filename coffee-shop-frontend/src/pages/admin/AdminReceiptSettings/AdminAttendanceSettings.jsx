import { useEffect, useState } from "react";
import { Loader2, Save, Clock, AlertTriangle, Key, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import attendanceSettingService from "@/services/attendanceSettingService";

export default function AdminAttendanceSettings() {
  const [form, setForm] = useState({
    early_checkin_minutes: 15,
    late_after_minutes: 10,
    kiosk_secret_key: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await attendanceSettingService.getSetting();
        if (res?.data) {
          setForm({
            early_checkin_minutes: res.data.early_checkin_minutes ?? 15,
            late_after_minutes: res.data.late_after_minutes ?? 10,
            kiosk_secret_key: res.data.kiosk_secret_key || "",
          });
        }
      } catch {
        toast.error("Không thể tải cấu hình điểm danh");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    if (field === "kiosk_secret_key") {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
      return;
    }
    const num = parseInt(value, 10);
    setForm((prev) => ({
      ...prev,
      [field]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await attendanceSettingService.updateSetting(form);
      toast.success("Cập nhật cấu hình điểm danh thành công!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-7 h-7 animate-spin" />
        <p className="text-sm">Đang tải cấu hình điểm danh...</p>
      </div>
    );
  }

  const early = form.early_checkin_minutes;
  const late = form.late_after_minutes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Cấu hình khung giờ điểm danh, ngưỡng tính đi trễ và bảo mật Kiosk.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu thiết lập
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Early Check-in Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300">Cho phép check-in sớm</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Trước giờ bắt đầu ca bao nhiêu phút thì được điểm danh
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-end gap-4">
              <div className="space-y-1.5 w-36">
                <Label htmlFor="early_checkin_minutes" className="text-xs text-muted-foreground">Số phút</Label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <Input
                    id="early_checkin_minutes"
                    type="number"
                    min="0"
                    value={form.early_checkin_minutes}
                    onChange={(e) => handleChange("early_checkin_minutes", e.target.value)}
                    className="border-0 font-mono text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span className="pr-3 text-sm text-muted-foreground select-none">phút</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pb-1">
                {early === 0
                  ? "Nhân viên chỉ có thể check-in từ đúng giờ bắt đầu ca."
                  : `Nhân viên có thể check-in từ ${early} phút trước giờ bắt đầu ca.`}
              </p>
            </div>
          </div>

          {/* Late After Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-100 dark:border-orange-900">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-orange-800 dark:text-orange-300">Ngưỡng tính đi trễ</h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  Sau bao nhiêu phút kể từ giờ bắt đầu mới bị đánh dấu <span className="font-semibold">Trễ</span>
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-end gap-4">
              <div className="space-y-1.5 w-36">
                <Label htmlFor="late_after_minutes" className="text-xs text-muted-foreground">Số phút</Label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                  <Input
                    id="late_after_minutes"
                    type="number"
                    min="0"
                    value={form.late_after_minutes}
                    onChange={(e) => handleChange("late_after_minutes", e.target.value)}
                    className="border-0 font-mono text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span className="pr-3 text-sm text-muted-foreground select-none">phút</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pb-1">
                {late === 0
                  ? "Check-in sau đúng giờ bắt đầu ca sẽ bị ghi nhận là Đi trễ."
                  : `Check-in sau ${late} phút kể từ giờ bắt đầu ca sẽ bị ghi nhận là Đi trễ.`}
              </p>
            </div>
          </div>

          {/* Kiosk Secret Key Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-purple-800 dark:text-purple-300">Mã bảo mật Kiosk (Máy chấm công)</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  Mã dùng để kích hoạt ứng dụng điểm danh trên máy tính bảng
                </p>
              </div>
              <Button onClick={handleSave} disabled={isSaving} size="sm" variant="outline" className="gap-2 shrink-0 bg-white dark:bg-slate-800">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </Button>
            </div>
            <div className="px-5 py-4 flex flex-col md:flex-row md:items-end gap-4">
              <div className="space-y-1.5 w-full md:w-80 shrink-0">
                <Label htmlFor="kiosk_secret_key" className="text-xs text-muted-foreground">Mật khẩu kích hoạt</Label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 bg-white dark:bg-slate-950 pr-2">
                  <Input
                    id="kiosk_secret_key"
                    type={showPassword ? "text" : "password"}
                    value={form.kiosk_secret_key}
                    onChange={(e) => handleChange("kiosk_secret_key", e.target.value)}
                    placeholder="VD: CAFE2026..."
                    className="border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pb-1">
                Để trống nếu muốn sử dụng mã Kiosk mặc định của hệ thống.
              </p>
            </div>
          </div>

        </div>

        {/* Right: Timeline Preview */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm h-fit">
          <h3 className="text-sm font-semibold mb-1">Minh họa khung giờ</h3>
          <p className="text-xs text-muted-foreground mb-5">Ví dụ với ca bắt đầu lúc <span className="font-mono font-semibold">08:00</span></p>

          <div className="space-y-3 text-xs">
            {/* Timeline bar */}
            <div className="relative">
              {/* Track */}
              <div className="h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-100 dark:bg-blue-900/60" style={{ width: "25%" }} />
                <div className="bg-green-100 dark:bg-green-900/60" style={{ width: "35%" }} />
                <div className="bg-orange-100 dark:bg-orange-900/60" style={{ width: "40%" }} />
              </div>
            </div>

            {/* Segments */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-blue-400 dark:bg-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {early > 0 ? `07:${String(60 - early).padStart(2, "0")}` : "08:00"}
                    {" "}&rarr;{" "}08:00
                  </p>
                  <p className="text-muted-foreground">
                    {early > 0
                      ? `Cửa sổ check-in sớm (${early} phút trước ca)`
                      : "Không cho check-in sớm"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    08:00 &rarr; 08:{String(late).padStart(2, "0")}
                  </p>
                  <p className="text-muted-foreground">Check-in đúng giờ → trạng thái <span className="font-semibold text-green-600">Có mặt</span></p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    Sau 08:{String(late).padStart(2, "0")} &rarr; hết ca
                  </p>
                  <p className="text-muted-foreground">Check-in muộn → trạng thái <span className="font-semibold text-orange-500">Đi trễ</span></p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-600 dark:text-slate-400">Sau khi ca kết thúc</p>
                  <p className="text-muted-foreground">Không thể check-in. Hệ thống tự ghi <span className="font-semibold">Vắng mặt</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
