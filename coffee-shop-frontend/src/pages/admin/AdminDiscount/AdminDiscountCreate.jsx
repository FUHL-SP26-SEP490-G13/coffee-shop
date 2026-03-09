import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import discountService from "@/services/discountService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  Ticket,
  Loader2,
  Percent,
  Calendar,
  Users,
} from "lucide-react";

export default function AdminDiscountCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: "",
    description: "",
    percentage: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

  // errors theo từng field
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // để chỉ show lỗi sau khi user chạm vào field

  const formatCurrency = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("vi-VN") + " VNĐ";
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateField = (name, value, all = form) => {
    const v = typeof value === "string" ? value.trim() : value;

    const toNumber = (x) => {
      if (x === "" || x === null || x === undefined) return NaN;
      return Number(x);
    };

    switch (name) {
      case "code": {
        if (!v) return "Mã giảm giá là bắt buộc";
        if (v.length < 3) return "Mã giảm giá tối thiểu 3 ký tự";
        if (v.length > 50) return "Mã giảm giá tối đa 50 ký tự";
        return "";
      }
      case "description": {
        if (!v) return "Mô tả là bắt buộc";
        if (v.length < 3) return "Mô tả tối thiểu 3 ký tự";
        return "";
      }
      case "percentage": {
        const n = toNumber(value);
        if (value === "" || value === null || value === undefined)
          return "Phần trăm giảm là bắt buộc";
        if (Number.isNaN(n)) return "Phần trăm giảm phải là số";
        if (n < 1 || n > 100) return "Phần trăm giảm phải từ 1 đến 100";
        return "";
      }
      case "min_order_amount": {
        const n = toNumber(value);
        if (value === "" || value === null || value === undefined)
          return "Đơn hàng tối thiểu là bắt buộc";
        if (Number.isNaN(n)) return "Đơn tối thiểu phải là số";
        if (n < 0) return "Đơn tối thiểu phải >= 0";
        return "";
      }
      case "max_discount_amount": {
        const n = toNumber(value);
        if (value === "" || value === null || value === undefined)
          return "Giảm tối đa là bắt buộc";
        if (Number.isNaN(n)) return "Giảm tối đa phải là số";
        if (n < 0) return "Giảm tối đa phải >= 0";

        return "";
      }
      case "usage_limit": {
        const n = toNumber(value);
        if (value === "" || value === null || value === undefined)
          return "Giới hạn lượt sử dụng là bắt buộc";
        if (Number.isNaN(n)) return "Giới hạn lượt phải là số";
        if (!Number.isInteger(n)) return "Giới hạn lượt phải là số nguyên";
        if (n < 1) return "Giới hạn lượt phải >= 1";
        return "";
      }
      case "valid_from": {
        if (!value) return "Ngày bắt đầu là bắt buộc";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "Ngày bắt đầu không hợp lệ";
        return "";
      }
      case "valid_until": {
        if (!value) return "Ngày kết thúc là bắt buộc";
        const end = new Date(value);
        if (Number.isNaN(end.getTime())) return "Ngày kết thúc không hợp lệ";

        if (all.valid_from) {
          const start = new Date(all.valid_from);
          if (!Number.isNaN(start.getTime()) && end <= start) {
            return "Ngày kết thúc phải sau ngày bắt đầu";
          }
        }
        return "";
      }
      case "is_active": {
        // checkbox luôn có giá trị boolean, coi như luôn hợp lệ
        return "";
      }
      default:
        return "";
    }
  };

  const validateAll = (data = form) => {
    const next = {};
    Object.keys(data).forEach((k) => {
      next[k] = validateField(k, data[k], data);
    });

    // rule liên quan 2 field: valid_until & valid_from đã xử lý trong validateField(valid_until)
    // rule liên quan 2 field: max_discount_amount vs min_order_amount đã xử lý trong validateField(max_discount_amount)

    // loại bỏ error rỗng
    Object.keys(next).forEach((k) => {
      if (!next[k]) delete next[k];
    });

    return next;
  };

  const isValid = useMemo(() => {
    const e = validateAll(form);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextValue = type === "checkbox" ? checked : value;
    setField(name, nextValue);

    // nếu field đã touched thì validate realtime
    if (touched[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        const msg = validateField(name, nextValue, {
          ...form,
          [name]: nextValue,
        });

        if (msg) nextErrors[name] = msg;
        else delete nextErrors[name];

        // validate liên quan chéo
        if (name === "min_order_amount") {
          const msg2 = validateField(
            "max_discount_amount",
            form.max_discount_amount,
            { ...form, [name]: nextValue }
          );
          if (msg2) nextErrors.max_discount_amount = msg2;
          else delete nextErrors.max_discount_amount;
        }

        if (name === "valid_from") {
          const msg2 = validateField("valid_until", form.valid_until, {
            ...form,
            [name]: nextValue,
          });
          if (msg2) nextErrors.valid_until = msg2;
          else delete nextErrors.valid_until;
        }

        return nextErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const msg = validateField(name, form[name], form);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate toàn bộ trước khi submit
    const nextErrors = validateAll(form);
    setErrors(nextErrors);

    // set touched hết để show lỗi
    const allTouched = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);

      await discountService.create({
        ...form,
        code: form.code.trim(),
        description: form.description.trim(),
        percentage: Number(form.percentage),
        min_order_amount: Number(form.min_order_amount),
        max_discount_amount: Number(form.max_discount_amount),
        usage_limit: Number(form.usage_limit),
        valid_from: form.valid_from,
        valid_until: form.valid_until,
        is_active: !!form.is_active,
      });

      alert("Tạo mã giảm giá thành công");
      navigate("/admin/discounts");
    } catch (err) {
      console.error(err);

      const response = err?.response?.data;

      // 1️⃣ Nếu là lỗi validation từ middleware
      if (response?.errors && Array.isArray(response.errors)) {
        const beErrors = {};

        response.errors.forEach((e) => {
          beErrors[e.field] = e.message;
        });

        setErrors(beErrors);

        // show tất cả lỗi
        const allTouched = {};
        Object.keys(form).forEach((k) => (allTouched[k] = true));
        setTouched(allTouched);

        return;
      }

      // 2️⃣ Nếu là lỗi business (ví dụ trùng code)
      if (response?.message) {
        alert(response.message);
        return;
      }

      alert("Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl p-4 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/discounts")}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-1">Tạo mã giảm giá mới</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm mã giảm giá để áp dụng cho đơn hàng
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Ticket className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Thông tin cơ bản</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Mã giảm giá <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="VD: SUMMER2024"
                />
                {touched.code && errors.code && (
                  <p className="text-xs text-destructive">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">
                  Phần trăm giảm (%) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="percentage"
                    type="number"
                    name="percentage"
                    value={form.percentage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="10"
                    min="1"
                    max="100"
                    className="pl-10"
                  />
                </div>
                {touched.percentage && errors.percentage && (
                  <p className="text-xs text-destructive">
                    {errors.percentage}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Giảm giá mùa hè..."
              />
              {touched.description && errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Discount Limits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className="text-primary font-semibold">₫</span>
              <h3 className="font-semibold">Giới hạn giảm giá</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">
                  Đơn hàng tối thiểu (VNĐ){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    VNĐ
                  </span>
                  <Input
                    id="min_order_amount"
                    type="number"
                    name="min_order_amount"
                    value={form.min_order_amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="VD: 100000"
                    className="pr-12"
                  />
                </div>
                {form.min_order_amount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(form.min_order_amount)}
                  </p>
                )}
                {touched.min_order_amount && errors.min_order_amount && (
                  <p className="text-xs text-destructive">
                    {errors.min_order_amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_discount_amount">
                  Giảm tối đa (VNĐ) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    VNĐ
                  </span>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    name="max_discount_amount"
                    value={form.max_discount_amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="VD: 50000"
                    className="pr-12"
                  />
                </div>
                {form.max_discount_amount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(form.max_discount_amount)}
                  </p>
                )}
                {touched.max_discount_amount && errors.max_discount_amount && (
                  <p className="text-xs text-destructive">
                    {errors.max_discount_amount}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">
                Giới hạn lượt sử dụng{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="usage_limit"
                  type="number"
                  name="usage_limit"
                  value={form.usage_limit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="VD: 50"
                  className="pl-10"
                />
              </div>
              {touched.usage_limit && errors.usage_limit && (
                <p className="text-xs text-destructive">{errors.usage_limit}</p>
              )}
            </div>
          </div>

          {/* Validity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Thời gian hiệu lực</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  name="valid_from"
                  value={form.valid_from}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.valid_from && errors.valid_from && (
                  <p className="text-xs text-destructive">
                    {errors.valid_from}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  name="valid_until"
                  value={form.valid_until}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.valid_until && errors.valid_until && (
                  <p className="text-xs text-destructive">
                    {errors.valid_until}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setField("is_active", !!checked)}
              />
              <Label
                htmlFor="is_active"
                className="text-sm font-medium cursor-pointer"
              >
                Kích hoạt mã giảm giá ngay
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="sm:flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  Tạo mã giảm giá
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/discounts")}
              disabled={loading}
              className="sm:flex-1"
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
