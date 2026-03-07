import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  DISCOUNT_RULES,
  validateDiscountForm,
  validateDiscountField,
  getCountText,
} from "@/utils/discountValidation";

export default function AdminDiscountEdit() {
  const { id } = useParams();
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
    used_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isLockedByUsedCount = Number(form.used_count ?? 0) > 0;

  const formatCurrency = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("vi-VN") + " VNĐ";
  };

  const getSubmitErrors = () => {
    if (!isLockedByUsedCount) {
      return validateDiscountForm(form);
    }

    const nextErrors = {};

    ["description", "valid_until", "is_active"].forEach((field) => {
      const error = validateDiscountField(field, form[field], form);
      if (error) nextErrors[field] = error;
    });

    return nextErrors;
  };

  const isValid = useMemo(() => {
    const e = getSubmitErrors();
    return Object.keys(e).length === 0;
  }, [form, isLockedByUsedCount]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const d = await discountService.getById(id);

        setForm({
          code: d.code ?? "",
          description: d.description ?? "",
          percentage:
            d.percentage !== null && d.percentage !== undefined
              ? String(d.percentage)
              : "",
          min_order_amount:
            d.min_order_amount !== null && d.min_order_amount !== undefined
              ? String(d.min_order_amount)
              : "",
          max_discount_amount:
            d.max_discount_amount !== null &&
            d.max_discount_amount !== undefined
              ? String(d.max_discount_amount)
              : "",
          usage_limit:
            d.usage_limit !== null && d.usage_limit !== undefined
              ? String(d.usage_limit)
              : "",
          valid_from: d.valid_from ? String(d.valid_from).slice(0, 16) : "",
          valid_until: d.valid_until ? String(d.valid_until).slice(0, 16) : "",
          is_active: !!d.is_active,
          used_count: Number(d.used_count ?? 0),
        });

        setErrors({});
      } catch (e) {
        alert("Không tìm thấy discount");
        navigate("/admin/discounts");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    const nextForm = {
      ...form,
      [name]: nextValue,
    };

    setForm(nextForm);

    setErrors((prev) => ({
      ...prev,
      [name]: validateDiscountField(name, nextValue, nextForm),

      ...(name === "valid_from" && !isLockedByUsedCount
        ? {
            valid_until: validateDiscountField(
              "valid_until",
              nextForm.valid_until,
              nextForm
            ),
          }
        : {}),

      ...(name === "min_order_amount" && !isLockedByUsedCount
        ? {
            max_discount_amount: validateDiscountField(
              "max_discount_amount",
              nextForm.max_discount_amount,
              nextForm
            ),
          }
        : {}),

      server: "",
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: validateDiscountField(name, form[name], form),

      ...(name === "valid_from" && !isLockedByUsedCount
        ? {
            valid_until: validateDiscountField(
              "valid_until",
              form.valid_until,
              form
            ),
          }
        : {}),

      ...(name === "min_order_amount" && !isLockedByUsedCount
        ? {
            max_discount_amount: validateDiscountField(
              "max_discount_amount",
              form.max_discount_amount,
              form
            ),
          }
        : {}),
    }));
  };

  const handleCheckedChange = (checked) => {
    const nextForm = {
      ...form,
      is_active: !!checked,
    };

    setForm(nextForm);

    setErrors((prev) => ({
      ...prev,
      is_active: "",
      server: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = getSubmitErrors();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);

      const payload = isLockedByUsedCount
        ? {
            description: form.description.trim(),
            valid_until: form.valid_until,
            is_active: !!form.is_active,
          }
        : {
            code: form.code.trim(),
            description: form.description.trim(),
            percentage: Number(form.percentage),
            min_order_amount: Number(form.min_order_amount),
            max_discount_amount: Number(form.max_discount_amount),
            usage_limit: Number(form.usage_limit),
            valid_from: form.valid_from,
            valid_until: form.valid_until,
            is_active: !!form.is_active,
          };

      await discountService.update(id, payload);

      alert("Cập nhật thành công");
      navigate("/admin/discounts");
    } catch (err) {
      const response = err?.response?.data;

      if (response?.errors && Array.isArray(response.errors)) {
        const beErrors = {};
        response.errors.forEach((e) => {
          if (e.field) beErrors[e.field] = e.message;
        });
        setErrors(beErrors);
        return;
      }

      if (response?.message) {
        setErrors((prev) => ({
          ...prev,
          server: response.message,
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        server: "Cập nhật thất bại",
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      </div>
    );
  }
  console.log("submitErrors", getSubmitErrors());
  console.log("isValid", isValid);
  console.log("form", form);

  return (
    <div className="max-w-4xl p-4 mx-auto">
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
            <span className="text-lg mb-1">
              Chỉnh sửa mã giảm giá
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Cập nhật thông tin mã giảm giá
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isLockedByUsedCount && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Mã giảm giá này đã được sử dụng ({form.used_count} lượt). Bạn chỉ
              được sửa mô tả, ngày kết thúc và trạng thái kích hoạt.
            </div>
          )}

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
                  disabled={isLockedByUsedCount}
                />

                <div className="flex items-center justify-between">
                  {errors.code && !isLockedByUsedCount ? (
                    <p className="text-xs text-destructive">{errors.code}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {isLockedByUsedCount
                        ? "Mã giảm giá chỉ hiển thị để tham chiếu"
                        : form.code.trim().length > 0 &&
                          `Tiến độ: ${getCountText(
                            form.code.trim().length,
                            DISCOUNT_RULES.CODE_MIN
                          )}`}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {form.code.length}/{DISCOUNT_RULES.CODE_MAX}
                  </p>
                </div>
              </div>

              {!isLockedByUsedCount && (
                <div className="space-y-2">
                  <Label htmlFor="percentage">
                    Phần trăm giảm (%){" "}
                    <span className="text-destructive">*</span>
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

                  <div className="flex items-center justify-between">
                    {errors.percentage ? (
                      <p className="text-xs text-destructive">
                        {errors.percentage}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {form.percentage && "Giá trị hợp lệ từ 1 - 100%"}
                      </p>
                    )}

                    {form.percentage && (
                      <p className="text-xs text-muted-foreground">
                        {form.percentage}/100
                      </p>
                    )}
                  </div>
                </div>
              )}
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
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {form.description.trim().length > 0 &&
                      `Tiến độ: ${getCountText(
                        form.description.trim().length,
                        DISCOUNT_RULES.DESCRIPTION_MIN
                      )}`}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {form.description.length}/{DISCOUNT_RULES.DESCRIPTION_MAX}
                </p>
              </div>
            </div>
          </div>

          {!isLockedByUsedCount && (
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

                  <div className="flex items-center justify-between">
                    {errors.min_order_amount ? (
                      <p className="text-xs text-destructive">
                        {errors.min_order_amount}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {form.min_order_amount && "Giá trị phải >= 0"}
                      </p>
                    )}

                    {form.min_order_amount && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(form.min_order_amount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">
                    Giảm tối đa (VNĐ){" "}
                    <span className="text-destructive">*</span>
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

                  <div className="flex items-center justify-between">
                    {errors.max_discount_amount ? (
                      <p className="text-xs text-destructive">
                        {errors.max_discount_amount}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {form.max_discount_amount && "Giá trị phải >= 0"}
                      </p>
                    )}

                    {form.max_discount_amount && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(form.max_discount_amount)}
                      </p>
                    )}
                  </div>
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

                <div className="flex items-center justify-between">
                  {errors.usage_limit ? (
                    <p className="text-xs text-destructive">
                      {errors.usage_limit}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {form.usage_limit &&
                        "Giá trị phải là số nguyên từ 1 - 1000"}
                    </p>
                  )}

                  {form.usage_limit && (
                    <p className="text-xs text-muted-foreground">
                      {form.usage_limit}/1000
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  disabled={isLockedByUsedCount}
                />
                {errors.valid_from && !isLockedByUsedCount ? (
                  <p className="text-xs text-destructive">
                    {errors.valid_from}
                  </p>
                ) : (
                  form.valid_from && (
                    <p className="text-xs text-muted-foreground">
                      {isLockedByUsedCount
                        ? "Ngày bắt đầu chỉ hiển thị để tham chiếu"
                        : new Date(form.valid_from).toLocaleString("vi-VN")}
                    </p>
                  )
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
                {errors.valid_until ? (
                  <p className="text-xs text-destructive">
                    {errors.valid_until}
                  </p>
                ) : (
                  form.valid_until && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(form.valid_until).toLocaleString("vi-VN")}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={handleCheckedChange}
              />
              <Label
                htmlFor="is_active"
                className="text-sm font-medium cursor-pointer"
              >
                Kích hoạt mã giảm giá
              </Label>
            </div>
          </div>

          {errors.server && (
            <p className="text-sm text-destructive">{errors.server}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving || !isValid}
              className="sm:flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  Cập nhật
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/discounts")}
              disabled={saving}
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
