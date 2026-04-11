import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Printer, Save, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import receiptSettingService from "@/services/receiptSettingService";
import deliveryAreaService from "@/services/deliveryAreaService";

const DEFAULT_FORM = {
  store_name: "Coffee Shop",
  address: "",
  latitude: "",
  longitude: "",
  location_source: "manual_pin",
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

const unwrapApiData = (response) => {
  if (
    response &&
    typeof response.data === "object" &&
    response.data !== null &&
    Object.prototype.hasOwnProperty.call(response.data, "data")
  ) {
    return response.data.data;
  }

  return response?.data;
};

export default function AdminReceiptSettings() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [initialAddress, setInitialAddress] = useState("");
  const [isPinningLocation, setIsPinningLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const [isCreatingProvince, setIsCreatingProvince] = useState(false);
  const [isCreatingWard, setIsCreatingWard] = useState(false);
  const [togglingWardId, setTogglingWardId] = useState(null);
  const [editingWardId, setEditingWardId] = useState(null);
  const [editingShippingFee, setEditingShippingFee] = useState("");
  const [savingWardFeeId, setSavingWardFeeId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [wards, setWards] = useState([]);
  const [provinceNameInput, setProvinceNameInput] = useState("");
  const [wardForm, setWardForm] = useState({
    province_id: "",
    name: "",
    shipping_fee: "",
    is_active: true,
  });

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
            latitude:
              data.latitude === null || data.latitude === undefined
                ? ""
                : String(data.latitude),
            longitude:
              data.longitude === null || data.longitude === undefined
                ? ""
                : String(data.longitude),
            location_source: data.location_source || "manual_pin",
            phone: data.phone || "",
            logo_url: data.logo_url || "",
            header_text: fromLines(data.header_lines),
            footer_text: fromLines(data.footer_lines),
            is_active: typeof data.is_active === "boolean" ? data.is_active : Boolean(data.is_active),
            open_time: data.open_time || "07:00",
            close_time: data.close_time || "22:30",
          });
          setInitialAddress(data.address || "");
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

  const loadProvinces = useCallback(async (preferredProvinceId = null, currentSelectedIdInput = null) => {
    const res = await deliveryAreaService.getProvinces();
    const data = unwrapApiData(res);
    const nextProvinces = Array.isArray(data) ? data : [];
    setProvinces(nextProvinces);

    if (nextProvinces.length === 0) {
      setSelectedProvinceId("");
      setWardForm((prev) => ({
        ...prev,
        province_id: "",
      }));
      return;
    }

    const normalizedPreferredId = Number(preferredProvinceId || 0);
    const hasPreferred =
      normalizedPreferredId > 0 &&
      nextProvinces.some((item) => Number(item.id) === normalizedPreferredId);

    const currentSelectedId = Number(currentSelectedIdInput || 0);
    const hasCurrentSelected =
      currentSelectedId > 0 &&
      nextProvinces.some((item) => Number(item.id) === currentSelectedId);

    const nextSelected = String(
      hasPreferred
        ? normalizedPreferredId
        : hasCurrentSelected
        ? currentSelectedId
        : Number(nextProvinces[0].id)
    );

    setSelectedProvinceId(nextSelected);
    setWardForm((prev) => ({
      ...prev,
      province_id: prev.province_id || nextSelected,
    }));
  }, []);

  const loadWards = useCallback(async (provinceId) => {
    const numericProvinceId = Number(provinceId || 0);

    if (numericProvinceId <= 0) {
      setWards([]);
      return;
    }

    const res = await deliveryAreaService.getWardsByProvince(numericProvinceId);
    const data = unwrapApiData(res);
    setWards(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setIsAreaLoading(true);
        await loadProvinces(null, selectedProvinceId);
      } catch (error) {
        console.error("Lỗi tải khu vực giao hàng:", error);
        toast.error("Không thể tải danh sách khu vực giao hàng");
      } finally {
        setIsAreaLoading(false);
      }
    };

    fetchAreas();
  }, [loadProvinces, selectedProvinceId]);

  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedProvinceId) {
        setWards([]);
        return;
      }

      try {
        setIsAreaLoading(true);
        await loadWards(selectedProvinceId);
      } catch (error) {
        console.error("Lỗi tải danh sách xã/phường:", error);
        toast.error("Không thể tải danh sách xã/phường");
      } finally {
        setIsAreaLoading(false);
      }
    };

    fetchWards();
  }, [loadWards, selectedProvinceId]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "address" && value.trim() !== String(initialAddress || "").trim()) {
        next.latitude = "";
        next.longitude = "";
      }

      return next;
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setIsPinningLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(Number(position.coords.latitude.toFixed(7))),
          longitude: String(Number(position.coords.longitude.toFixed(7))),
          location_source: "gps",
        }));
        toast.success("Đã ghim tọa độ cửa hàng thành công");
        setIsPinningLocation(false);
      },
      (error) => {
        const message =
          error?.code === 1
            ? "Bạn đã từ chối quyền truy cập vị trí"
            : "Không lấy được vị trí hiện tại, vui lòng thử lại";
        toast.error(message);
        setIsPinningLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = async () => {
    try {
      const normalizedAddress = String(form.address || "").trim();
      const isAddressChanged = normalizedAddress !== String(initialAddress || "").trim();
      const hasCoords = form.latitude !== "" && form.longitude !== "";

      if (normalizedAddress && isAddressChanged && !hasCoords) {
        toast.error("Bạn vừa đổi địa chỉ cửa hàng. Vui lòng ghim lại tọa độ trước khi lưu.");
        return;
      }

      setIsSaving(true);

      const formData = new FormData();
      formData.append("store_name", form.store_name?.trim() || "");
      formData.append("address", normalizedAddress);

      if (form.latitude !== "") {
        formData.append("latitude", String(form.latitude));
      }

      if (form.longitude !== "") {
        formData.append("longitude", String(form.longitude));
      }

      if (form.location_source) {
        formData.append("location_source", String(form.location_source));
      }

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

      setInitialAddress(saved?.address || normalizedAddress);

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

  const handleCreateProvince = async () => {
    const normalizedName = String(provinceNameInput || "").trim();

    if (!normalizedName) {
      toast.error("Vui lòng nhập tên Tỉnh/Thành");
      return;
    }

    try {
      setIsCreatingProvince(true);
      const res = await deliveryAreaService.createProvince({ name: normalizedName });
      const createdProvince = unwrapApiData(res);
      const createdProvinceId = Number(createdProvince?.id || 0);

      await loadProvinces(
        createdProvinceId > 0 ? createdProvinceId : null,
        selectedProvinceId
      );
      setProvinceNameInput("");
      toast.success("Đã thêm Tỉnh/Thành giao hàng");
    } catch (error) {
      console.error("Lỗi tạo tỉnh/thành:", error);
      toast.error(error?.response?.data?.message || "Không thể tạo Tỉnh/Thành");
    } finally {
      setIsCreatingProvince(false);
    }
  };

  const handleCreateWard = async () => {
    const normalizedWardName = String(wardForm.name || "").trim();
    const normalizedProvinceId = Number(wardForm.province_id || 0);
    const normalizedShippingFee = Number(wardForm.shipping_fee || 0);

    if (normalizedProvinceId <= 0) {
      toast.error("Vui lòng chọn Tỉnh/Thành cho xã/phường");
      return;
    }

    if (!normalizedWardName) {
      toast.error("Vui lòng nhập tên Xã/Phường");
      return;
    }

    if (!Number.isFinite(normalizedShippingFee) || normalizedShippingFee < 0) {
      toast.error("Phí vận chuyển không hợp lệ");
      return;
    }

    try {
      setIsCreatingWard(true);
      await deliveryAreaService.createWard({
        name: normalizedWardName,
        province_id: normalizedProvinceId,
        shipping_fee: Math.round(normalizedShippingFee),
        is_active: wardForm.is_active ? 1 : 0,
      });

      if (String(normalizedProvinceId) !== String(selectedProvinceId)) {
        setSelectedProvinceId(String(normalizedProvinceId));
      } else {
        await loadWards(normalizedProvinceId);
      }

      setWardForm((prev) => ({
        ...prev,
        name: "",
        shipping_fee: "",
      }));

      toast.success("Đã thêm khu vực giao hàng");
    } catch (error) {
      console.error("Lỗi tạo xã/phường:", error);
      toast.error(error?.response?.data?.message || "Không thể tạo xã/phường");
    } finally {
      setIsCreatingWard(false);
    }
  };

  const handleToggleWard = async (ward) => {
    try {
      setTogglingWardId(ward.id);
      await deliveryAreaService.updateWard(ward.id, {
        is_active: Number(ward.is_active) === 1 ? 0 : 1,
      });
      await loadWards(selectedProvinceId);
      toast.success("Đã cập nhật trạng thái xã/phường");
    } catch (error) {
      console.error("Lỗi cập nhật xã/phường:", error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật xã/phường");
    } finally {
      setTogglingWardId(null);
    }
  };

  const handleStartEditWardFee = (ward) => {
    setEditingWardId(Number(ward.id));
    setEditingShippingFee(String(Number(ward.shipping_fee || 0)));
  };

  const handleCancelEditWardFee = () => {
    setEditingWardId(null);
    setEditingShippingFee("");
  };

  const handleSaveWardFee = async (ward) => {
    const normalizedShippingFee = Number(editingShippingFee);

    if (!Number.isFinite(normalizedShippingFee) || normalizedShippingFee < 0) {
      toast.error("Phí vận chuyển không hợp lệ");
      return;
    }

    try {
      setSavingWardFeeId(ward.id);
      await deliveryAreaService.updateWard(ward.id, {
        shipping_fee: Math.round(normalizedShippingFee),
      });

      await loadWards(selectedProvinceId);
      setEditingWardId(null);
      setEditingShippingFee("");
      toast.success("Đã cập nhật phí vận chuyển");
    } catch (error) {
      console.error("Lỗi cập nhật phí vận chuyển:", error);
      toast.error(error?.response?.data?.message || "Không thể cập nhật phí vận chuyển");
    } finally {
      setSavingWardFeeId(null);
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
            <h1 className="text-xl font-semibold">Cấu hình hệ thống</h1>
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

          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-amber-600" />
                Tọa độ cửa hàng
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={isPinningLocation}
              >
                {isPinningLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lấy vị trí...
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-4 h-4 mr-2" />
                    Ghim vị trí hiện tại
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={form.latitude}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude: e.target.value,
                    location_source: "manual_pin",
                  }))
                }
                placeholder="Vĩ độ (ví dụ: 21.0123456)"
              />
              <Input
                value={form.longitude}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    longitude: e.target.value,
                    location_source: "manual_pin",
                  }))
                }
                placeholder="Kinh độ (ví dụ: 105.8123456)"
              />
            </div>

            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Khi thay đổi địa chỉ cửa hàng, bạn bắt buộc phải ghim lại tọa độ hoặc nhập tay một điểm tọa độ hợp lệ.
            </p>
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

      <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border rounded-xl p-5 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Khu vực cho phép giao hàng</h2>
          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
            Thiết lập Tỉnh/Thành, Xã/Phường và phí vận chuyển cho từng khu vực.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="province_name">Thêm Tỉnh/Thành</Label>
            <div className="flex gap-2">
              <Input
                id="province_name"
                value={provinceNameInput}
                onChange={(e) => setProvinceNameInput(e.target.value)}
                placeholder="Ví dụ: TP Hồ Chí Minh"
              />
              <Button
                type="button"
                onClick={handleCreateProvince}
                disabled={isCreatingProvince}
              >
                {isCreatingProvince ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Thêm"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter_province">Xem danh sách theo Tỉnh/Thành</Label>
            <select
              id="filter_province"
              value={selectedProvinceId}
              onChange={(e) => setSelectedProvinceId(e.target.value)}
              className="w-full border rounded-md h-10 px-3 bg-transparent"
            >
              <option value="">Chọn Tỉnh/Thành</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Thêm Xã/Phường và phí vận chuyển</p>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ward_province">Tỉnh/Thành</Label>
              <select
                id="ward_province"
                value={wardForm.province_id}
                onChange={(e) =>
                  setWardForm((prev) => ({
                    ...prev,
                    province_id: e.target.value,
                  }))
                }
                className="w-full border rounded-md h-10 px-3 bg-transparent"
              >
                <option value="">Chọn Tỉnh/Thành</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="ward_name">Tên Xã/Phường</Label>
              <Input
                id="ward_name"
                value={wardForm.name}
                onChange={(e) =>
                  setWardForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Ví dụ: Phường Bến Nghé"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward_shipping_fee">Phí vận chuyển (đ)</Label>
              <Input
                id="ward_shipping_fee"
                type="number"
                min={0}
                step={1000}
                value={wardForm.shipping_fee}
                onChange={(e) =>
                  setWardForm((prev) => ({
                    ...prev,
                    shipping_fee: e.target.value,
                  }))
                }
                placeholder="15000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(wardForm.is_active)}
                onCheckedChange={(checked) =>
                  setWardForm((prev) => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
              <span className="text-sm">Kích hoạt khu vực này ngay</span>
            </div>

            <Button
              type="button"
              onClick={handleCreateWard}
              disabled={isCreatingWard}
            >
              {isCreatingWard ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                "Thêm khu vực"
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium">
            Danh sách Xã/Phường đang cấu hình
          </div>

          {!selectedProvinceId ? (
            <p className="px-4 py-4 text-sm text-muted-foreground dark:text-gray-400">
              Chọn Tỉnh/Thành để xem danh sách xã/phường.
            </p>
          ) : isAreaLoading ? (
            <div className="px-4 py-4 flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải danh sách xã/phường...
            </div>
          ) : wards.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground dark:text-gray-400">
              Chưa có xã/phường nào cho Tỉnh/Thành đã chọn.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-white dark:bg-gray-900">
                    <th className="text-left px-4 py-2 font-medium">Xã/Phường</th>
                    <th className="text-left px-4 py-2 font-medium">Phí vận chuyển</th>
                    <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
                    <th className="text-right px-4 py-2 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {wards.map((ward) => {
                    const isWardActive = Number(ward.is_active) === 1;
                    const isRowUpdating = Number(togglingWardId) === Number(ward.id);
                    const isEditingFee = Number(editingWardId) === Number(ward.id);
                    const isSavingFee = Number(savingWardFeeId) === Number(ward.id);

                    return (
                      <tr key={ward.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2">{ward.name}</td>
                        <td className="px-4 py-2">
                          {isEditingFee ? (
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              className="h-9"
                              value={editingShippingFee}
                              onChange={(e) => setEditingShippingFee(e.target.value)}
                            />
                          ) : (
                            `${Number(ward.shipping_fee || 0).toLocaleString("vi-VN")}đ`
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                              isWardActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {isWardActive ? "Đang phục vụ" : "Tạm ngưng"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-2">
                            {isEditingFee ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSavingFee}
                                  onClick={() => handleSaveWardFee(ward)}
                                >
                                  {isSavingFee ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Lưu phí"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isSavingFee}
                                  onClick={handleCancelEditWardFee}
                                >
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartEditWardFee(ward)}
                              >
                                Sửa phí
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isRowUpdating || isSavingFee}
                              onClick={() => handleToggleWard(ward)}
                            >
                              {isRowUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isWardActive ? (
                                "Ngưng giao"
                              ) : (
                                "Kích hoạt"
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
