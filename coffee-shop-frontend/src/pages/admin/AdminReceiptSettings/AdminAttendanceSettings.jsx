import { useEffect, useState } from "react";
import { Loader2, Save, Clock, AlertTriangle, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import attendanceSettingService from "@/services/attendanceSettingService";

export default function AdminAttendanceSettings() {
  const [form, setForm] = useState({
    early_checkin_minutes: 0,
    late_after_minutes: 0,
    max_late_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await attendanceSettingService.getSetting();
        if (res?.data) {
          setForm({
            early_checkin_minutes: res.data.early_checkin_minutes || 0,
            late_after_minutes: res.data.late_after_minutes || 0,
            max_late_minutes: res.data.max_late_minutes || 0,
          });
        }
      } catch (error) {
        toast.error("Không thể tải cấu hình điểm danh");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    // Only allow non-negative integers
    const num = parseInt(value, 10);
    setForm((prev) => ({
      ...prev,
      [field]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const handleSave = async () => {
    // Validate logic
    if (form.max_late_minutes <= 0) {
      toast.error(`Thời gian chặn Check-in bắt buộc phải lớn hơn 0 để giới hạn ca làm việc.`);
      return;
    }

    if (form.late_after_minutes >= form.max_late_minutes) {
      toast.error(`Thời gian tính đi muộn (${form.late_after_minutes}p) phải nhỏ hơn thời gian chặn Check-in (${form.max_late_minutes}p).`);
      return;
    }

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
      <div className="p-10 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Đang tải cấu hình điểm danh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 ">
        <div>
          {/* <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Cấu hình Điểm danh</h2> */}
          <p className="text-sm text-muted-foreground mt-1">Thiết lập các mốc giới hạn thời gian mở và đóng ca làm việc</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu thiết lập
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Early Checkin */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold px-1">Thời gian mở ca sớm</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="early_checkin_minutes">Số phút (Tối thiểu 0)</Label>
            <Input
              id="early_checkin_minutes"
              type="number"
              min="0"
              value={form.early_checkin_minutes}
              onChange={(e) => handleChange("early_checkin_minutes", e.target.value)}
              className="font-mono text-lg"
            />
          </div>
          <p className="text-xs text-slate-500">
            Cho phép nhân viên điểm danh trước giờ bắt đầu ca làm việc. Nếu đặt <b>0</b>, hệ thống chỉ chấp nhận điểm danh từ đúng thời điểm bắt đầu ca.
          </p>
        </div>

        {/* Late After */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 hover:border-orange-200 transition-colors">
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/40 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold px-1">Giới hạn đi muộn</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="late_after_minutes">Số phút (Sau giờ bắt đầu ca)</Label>
            <Input
              id="late_after_minutes"
              type="number"
              min="0"
              value={form.late_after_minutes}
              onChange={(e) => handleChange("late_after_minutes", e.target.value)}
              className="font-mono text-lg"
            />
          </div>
          <p className="text-xs text-slate-500">
            Thời gian tối đa nhân viên được phép điểm danh muộn mà không bị hệ thống ghi nhận là <span className="font-semibold text-orange-500">Đi trễ</span>. Nếu đặt <b>0</b>, nhân viên sẽ bị đánh dấu đi trễ ngay lập tức sau phút bắt đầu ca.
          </p>
        </div>

        {/* Max Late */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 hover:border-red-200 transition-colors">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="p-2 bg-red-50 dark:bg-red-900/40 rounded-lg">
              <ShieldX className="w-5 h-5" />
            </div>
            <h3 className="font-semibold px-1">Khóa điểm danh (Đóng ca)</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_late_minutes">Số phút (Buộc lớn hơn Giới hạn đi muộn)</Label>
            <Input
              id="max_late_minutes"
              type="number"
              min="1"
              value={form.max_late_minutes}
              onChange={(e) => handleChange("max_late_minutes", e.target.value)}
              className="font-mono text-lg border-red-200 focus-visible:ring-red-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            Thời gian tối đa nhân viên được phép điểm danh cho ca hiện tại. Khi vượt quá giới hạn này, hệ thống sẽ tự động đóng ca làm việc và từ chối ghi nhận điểm danh. (Bắt buộc {'>'} 0)
          </p>
        </div>
      </div>
    </div>
  );
}
