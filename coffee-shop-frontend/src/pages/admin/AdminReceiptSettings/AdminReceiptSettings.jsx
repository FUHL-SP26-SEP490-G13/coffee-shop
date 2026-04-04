import { useEffect, useMemo, useState } from "react";
import { Loader2, Printer, ReceiptText, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import receiptSettingService from "@/services/receiptSettingService";

const DEFAULT_FORM = {
  store_name: "Coffee Shop",
  address: "",
  phone: "",
  logo_url: "",
  header_text: "",
  footer_text: "",
  is_active: true,
  open_time: "07:00",
  close_time: "22:30",
};

const toLines = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const fromLines = (lines) => (Array.isArray(lines) ? lines.join("\n") : "");

export default function AdminReceiptSettings() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const previewHeaderLines = useMemo(() => toLines(form.header_text), [form.header_text]);
  const previewFooterLines = useMemo(() => toLines(form.footer_text), [form.footer_text]);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setIsLoading(true);
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;

        if (data) {
          setForm({
            store_name: data.store_name || "",
            address: data.address || "",
            phone: data.phone || "",
            logo_url: data.logo_url || "",
            header_text: fromLines(data.header_lines),
            footer_text: fromLines(data.footer_lines),
            is_active: typeof data.is_active === "boolean" ? data.is_active : Boolean(data.is_active),
            open_time: data.open_time || "07:00",
            close_time: data.close_time || "22:30",
          });
          setLogoPreview(data.logo_url || "");
        }
      } catch (error) {
        console.error("Lỗi tải cấu hình hóa đơn:", error);
        toast.error("Không thể tải cấu hình hóa đơn");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("store_name", form.store_name?.trim() || "");
      formData.append("address", form.address?.trim() || "");
      formData.append("phone", form.phone?.trim() || "");
      formData.append("header_lines", JSON.stringify(toLines(form.header_text)));
      formData.append("footer_lines", JSON.stringify(toLines(form.footer_text)));
      formData.append("is_active", String(Boolean(form.is_active)));
      formData.append("open_time", form.open_time);
      formData.append("close_time", form.close_time);
      formData.append("type", "receipt-settings");

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await receiptSettingService.upsert(formData);
      const saved = res?.data || null;

      if (saved?.logo_url) {
        setLogoPreview(saved.logo_url);
      }

      setLogoFile(null);

      toast.success("Lưu cấu hình hóa đơn thành công");
      window.dispatchEvent(new CustomEvent("receiptSettingsUpdated"));
    } catch (error) {
      console.error("Lỗi lưu cấu hình hóa đơn:", error);
      toast.error(error?.response?.data?.message || "Không thể lưu cấu hình hóa đơn");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPreview = () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>In thử hóa đơn</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #0f172a; }
            .receipt { max-width: 360px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .center { text-align: center; }
            .line { margin-top: 4px; font-size: 12px; }
            .section { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; }
            .total { font-weight: 700; }
            img { max-height: 56px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${displayLogo ? `<div class="center"><img src="${displayLogo}" alt="Logo" /></div>` : ""}
            <div class="center" style="font-size: 16px; font-weight: 700; text-transform: uppercase; margin-top: 8px;">${
              form.store_name || "Coffee Shop"
            }</div>
            ${form.address ? `<div class="center line">${form.address}</div>` : ""}
            ${form.phone ? `<div class="center line">ĐT: ${form.phone}</div>` : ""}

            ${
              previewHeaderLines.length > 0
                ? `<div class="section">${previewHeaderLines
                    .map((line) => `<div class="center line">${line}</div>`)
                    .join("")}</div>`
                : ""
            }

            <div class="section center" style="font-weight: 700; font-size: 13px; letter-spacing: 0.08em;">
              HÓA ĐƠN THANH TOÁN
            </div>

            <div class="section">
              <div class="row"><span>Mã đơn:</span><span>#HD1024</span></div>
              <div class="row"><span>Ngày:</span><span>${new Date().toLocaleString(
                "vi-VN"
              )}</span></div>
            </div>

            <div class="section">
              <div class="row"><span>Latte (M) x1</span><span>45.000đ</span></div>
              <div class="row"><span>Americano (L) x1</span><span>50.000đ</span></div>
            </div>

            <div class="section">
              <div class="row total"><span>Tổng cộng</span><span>95.000đ</span></div>
            </div>

            ${
              previewFooterLines.length > 0
                ? `<div class="section">${previewFooterLines
                    .map((line) => `<div class="center line">${line}</div>`)
                    .join("")}</div>`
                : ""
            }
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=480,height=760");
    if (!printWindow) {
      toast.error("Không thể mở cửa sổ in. Vui lòng cho phép popup.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground dark:text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Đang tải cấu hình hóa đơn...
      </div>
    );
  }

  const displayLogo = logoPreview || "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">Cấu hình hóa đơn</h1>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Lưu cấu hình
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">Tên cửa hàng</Label>
            <Input
              id="store_name"
              value={form.store_name}
              onChange={(e) => handleChange("store_name", e.target.value)}
              placeholder="Coffee Shop"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Q1, TP.HCM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="0909123456"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="open_time">Giờ mở cửa</Label>
              <Input
                id="open_time"
                type="time"
                value={form.open_time}
                onChange={(e) => handleChange("open_time", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close_time">Giờ đóng cửa</Label>
              <Input
                id="close_time"
                type="time"
                value={form.close_time}
                onChange={(e) => handleChange("close_time", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_file">Logo hóa đơn (tệp ảnh)</Label>
            <Input
              id="logo_file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setLogoFile(file);

                if (!file) {
                  return;
                }

                const localUrl = URL.createObjectURL(file);
                setLogoPreview(localUrl);
              }}
            />
            {logoFile ? (
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Đã chọn: {logoFile.name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Chưa chọn tệp mới, sẽ giữ logo hiện tại.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="header_lines">
              Header lines (mỗi dòng 1 nội dung)
            </Label>
            <Textarea
              id="header_lines"
              rows={5}
              value={form.header_text}
              onChange={(e) => handleChange("header_text", e.target.value)}
              placeholder={"Xin chào quý khách\nMở cửa 07:00 - 22:00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_lines">
              Footer lines (mỗi dòng 1 nội dung)
            </Label>
            <Textarea
              id="footer_lines"
              rows={5}
              value={form.footer_text}
              onChange={(e) => handleChange("footer_text", e.target.value)}
              placeholder={"Cảm ơn quý khách\nHẹn gặp lại"}
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Kích hoạt cấu hình này</p>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Hệ thống sẽ dùng cấu hình active để in hóa đơn
              </p>
            </div>
            <Switch
              checked={Boolean(form.is_active)}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border rounded-xl p-5 xl:col-start-2 xl:sticky xl:top-6 h-fit">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold">Xem trước hóa đơn</h2>
            <Button variant="outline" onClick={handlePrintPreview}>
              <Printer className="w-4 h-4 mr-2" />
              In thử
            </Button>
          </div>

          <div className="mx-auto max-w-[360px] bg-slate-50 dark:bg-slate-800 dark:border-slate-700 border rounded-lg p-4 text-sm text-slate-800 dark:text-slate-200">
            {displayLogo ? (
              <div className="flex justify-center mb-3">
                <img
                  src={displayLogo}
                  alt="Receipt Logo"
                  className="h-14 object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <p className="text-center text-base font-bold uppercase tracking-wide">
              {form.store_name || "Coffee Shop"}
            </p>
            {form.address ? (
              <p className="text-center text-xs mt-1">{form.address}</p>
            ) : null}
            {form.phone ? (
              <p className="text-center text-xs mt-1">ĐT: {form.phone}</p>
            ) : null}

            {previewHeaderLines.length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-1">
                {previewHeaderLines.map((line, index) => (
                  <p key={`header-${index}`} className="text-center text-xs">
                    {line}
                  </p>
                ))}
              </div>
            )}

            <p className="mt-3 border-t pt-3 text-center text-xs font-bold tracking-[0.12em]">
              HÓA ĐƠN THANH TOÁN
            </p>

            <div className="mt-3 border-t border-dashed pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Mã đơn:</span>
                <span>#HD1024</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Ngày:</span>
                <span>{new Date().toLocaleString("vi-VN")}</span>
              </div>
            </div>

            <div className="mt-3 border-t border-dashed pt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Latte (M) x1</span>
                <span>45.000đ</span>
              </div>
              <div className="flex justify-between">
                <span>Americano (L) x1</span>
                <span>50.000đ</span>
              </div>
            </div>

            <div className="mt-3 border-t border-dashed pt-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng</span>
                <span>95.000đ</span>
              </div>
            </div>

            {previewFooterLines.length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-1">
                {previewFooterLines.map((line, index) => (
                  <p key={`footer-${index}`} className="text-center text-xs">
                    {line}
                  </p>
                ))}
              </div>
            )}

            <p className="text-center text-[11px] mt-4 text-slate-500 dark:text-slate-400">
              Trạng thái cấu hình: {form.is_active ? "Đang kích hoạt" : "Tắt"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
