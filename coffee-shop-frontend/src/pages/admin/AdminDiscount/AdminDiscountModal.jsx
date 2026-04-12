import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Loader2, Percent, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import discountService from "@/services/discountService";
import {
  validateDiscountForm,
  validateDiscountField,
} from "@/utils/discountValidation";

export default function AdminDiscountModal({
  isOpen,
  onClose,
  discountId,
  onSuccess,
}) {
  const isEditing = !!discountId;

  const [form, setForm] = useState({
    code: "",
    description: "",
    percentage: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    used_count: 0,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isLockedByUsedCount = isEditing && Number(form.used_count ?? 0) > 0;

  const formatCurrency = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("vi-VN") + " VNĐ";
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        fetchDetail();
      } else {
        setForm({
          code: "",
          description: "",
          percentage: "",
          min_order_amount: "",
          max_discount_amount: "",
          usage_limit: "",
          valid_from: "",
          valid_until: "",
          used_count: 0,
        });
        setErrors({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, discountId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await discountService.getById(discountId);
      const d = res?.data?.data || res?.data || res;

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
          d.max_discount_amount !== null && d.max_discount_amount !== undefined
            ? String(d.max_discount_amount)
            : "",
        usage_limit:
          d.usage_limit !== null && d.usage_limit !== undefined
            ? String(d.usage_limit)
            : "",
        valid_from: d.valid_from ? String(d.valid_from).slice(0, 16) : "",
        valid_until: d.valid_until ? String(d.valid_until).slice(0, 16) : "",
        used_count: Number(d.used_count ?? 0),
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Không tìm thấy mã giảm giá");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name] || errors.server) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        server: "",
      }));
    }
  };

  const getSubmitErrors = () => {
    if (!isLockedByUsedCount) {
      return validateDiscountForm(form);
    }

    const nextErrors = {};
    ["description", "valid_until"].forEach((field) => {
      const error = validateDiscountField(field, form[field], form);
      if (error) nextErrors[field] = error;
    });

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = getSubmitErrors();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = isLockedByUsedCount
        ? {
            description: form.description.trim(),
            valid_until: form.valid_until,
          }
        : {
            code: form.code.trim(),
            description: form.description.trim(),
            percentage: Number(form.percentage),
            min_order_amount: Number(form.min_order_amount),
            max_discount_amount:
              form.max_discount_amount === ""
                ? null
                : Number(form.max_discount_amount),
            usage_limit:
              form.usage_limit === "" ? null : Number(form.usage_limit),
            valid_from: form.valid_from,
            valid_until: form.valid_until,
          };

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isEditing) {
        await discountService.update(discountId, payload);
        toast.success("Cập nhật mã giảm giá thành công");
      } else {
        await discountService.create(payload);
        toast.success("Tạo mã giảm giá thành công");
      }

      onSuccess();
      onClose();
    } catch (err) {
      const response = err?.response?.data;

      if (response?.errors && Array.isArray(response.errors)) {
        const beErrors = {};
        response.errors.forEach((item) => {
          if (item.field) {
            beErrors[item.field] = item.message;
          }
        });

        setErrors(beErrors);

        const duplicatedCodeError = response.errors.find(
          (item) =>
            item.field === "code" && item.message === "Mã giảm giá đã tồn tại"
        );

        if (duplicatedCodeError) {
          toast.error("Mã giảm giá đã tồn tại");
        }

        return;
      }

      setErrors((prev) => ({
        ...prev,
        server: response?.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            {isEditing ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {isLockedByUsedCount && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Mã giảm giá này đã được sử dụng {form.used_count} lượt. Bạn chỉ
                được sửa ngày kết thúc với mô tả.
              </div>
            )}

            <div className="space-y-4">
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
                    placeholder="VD: SUMMER2024"
                    disabled={isLockedByUsedCount}
                  />
                  {errors.code && (
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
                      placeholder="10"
                      min="1"
                      max="100"
                      className="pl-10"
                      disabled={isLockedByUsedCount}
                    />
                  </div>

                  {errors.percentage ? (
                    <p className="text-xs text-destructive">
                      {errors.percentage}
                    </p>
                  ) : (
                    form.percentage !== "" && (
                      <p className="text-xs text-muted-foreground">
                        Giá trị đã nhập: {form.percentage}%
                      </p>
                    )
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
                  placeholder="Giảm giá mùa hè..."
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
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
                      placeholder="VD: 100000"
                      className="pr-12"
                      min="0"
                      disabled={isLockedByUsedCount}
                    />
                  </div>

                  {errors.min_order_amount ? (
                    <p className="text-xs text-destructive">
                      {errors.min_order_amount}
                    </p>
                  ) : (
                    form.min_order_amount !== "" && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(form.min_order_amount)}
                      </p>
                    )
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
                      placeholder="VD: 50000"
                      className="pr-12"
                      min="0"
                      disabled={isLockedByUsedCount}
                    />
                  </div>

                  {errors.max_discount_amount ? (
                    <p className="text-xs text-destructive">
                      {errors.max_discount_amount}
                    </p>
                  ) : (
                    form.max_discount_amount !== "" && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(form.max_discount_amount)}
                      </p>
                    )
                  )}
                </div>
              </div>

              {!isLockedByUsedCount && (
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
                      placeholder="VD: 50"
                      className="pl-10"
                      min="0"
                    />
                  </div>

                  {errors.usage_limit ? (
                    <p className="text-xs text-destructive">
                      {errors.usage_limit}
                    </p>
                  ) : (
                    form.usage_limit !== "" && (
                      <p className="text-xs text-muted-foreground">
                        Giá trị đã nhập: {form.usage_limit}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
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
                    disabled={isLockedByUsedCount}
                  />
                  {errors.valid_from ? (
                    <p className="text-xs text-destructive">
                      {errors.valid_from}
                    </p>
                  ) : (
                    form.valid_from && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(form.valid_from).toLocaleString("vi-VN")}
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

            {errors.server && (
              <p className="text-sm text-destructive">{errors.server}</p>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    {isEditing ? "Cập nhật" : "Tạo mã giảm giá"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
