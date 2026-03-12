import { useState } from "react";
import { useNavigate } from "react-router-dom";
import discountService from "@/services/discountService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Ticket,
  Loader2,
  Percent,
  Calendar,
  Users,
} from "lucide-react";
import { validateDiscountForm } from "@/utils/discountValidation";

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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCurrency = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("vi-VN") + " VNĐ";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateDiscountForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);

      await discountService.create({
        code: form.code.trim(),
        description: form.description.trim(),
        percentage: Number(form.percentage),
        min_order_amount: Number(form.min_order_amount),
        max_discount_amount: Number(form.max_discount_amount),
        usage_limit: Number(form.usage_limit),
        valid_from: form.valid_from,
        valid_until: form.valid_until,
      });

      alert("Tạo mã giảm giá thành công");
      navigate("/admin/discounts");
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
        return;
      }

      setErrors((prev) => ({
        ...prev,
        server: response?.message || "Tạo thất bại",
      }));
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-lg mb-1">Tạo mã giảm giá mới</span>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm mã giảm giá để áp dụng cho đơn hàng
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="VD: SUMMER2024"
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
                    min="0"
                    max="100"
                    className="pl-10"
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
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

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
                    placeholder="VD: 100000"
                    className="pr-12"
                    min="0"
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
                <p className="text-xs text-destructive">{errors.usage_limit}</p>
              ) : (
                form.usage_limit !== "" && (
                  <p className="text-xs text-muted-foreground">
                    Giá trị đã nhập: {form.usage_limit}
                  </p>
                )
              )}
            </div>
          </div>

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

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={loading} className="sm:flex-1">
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
