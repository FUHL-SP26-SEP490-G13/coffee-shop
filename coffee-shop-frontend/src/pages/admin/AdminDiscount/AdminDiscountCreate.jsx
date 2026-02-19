import { useState } from "react";
import { useNavigate } from "react-router-dom";
import discountService from "@/services/discountService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  Ticket,
  Loader2,
  Percent,
  DollarSign,
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await discountService.create({
        ...form,
        percentage: Number(form.percentage),
        min_order_amount: form.min_order_amount
          ? Number(form.min_order_amount)
          : 0,
        max_discount_amount: form.max_discount_amount
          ? Number(form.max_discount_amount)
          : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      });

      alert("Tạo mã giảm giá thành công");
      navigate("/admin/discounts");
    } catch (err) {
      console.error(err);
      alert("Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl p-4">
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
            <h1 className="text-2xl md:text-3xl font-bold">
              Tạo mã giảm giá mới
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm mã giảm giá để áp dụng cho đơn hàng
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
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
                  required
                />
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
                    required
                    min="1"
                    max="100"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Giảm giá mùa hè..."
              />
            </div>
          </div>

          {/* Discount Limits Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Giới hạn giảm giá</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">Đơn hàng tối thiểu</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="min_order_amount"
                    type="number"
                    name="min_order_amount"
                    value={form.min_order_amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_discount_amount">
                  Giảm tối đa (tùy chọn)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max_discount_amount"
                    type="number"
                    name="max_discount_amount"
                    value={form.max_discount_amount}
                    onChange={handleChange}
                    placeholder="Không giới hạn"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">
                Giới hạn lượt sử dụng (tùy chọn)
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="usage_limit"
                  type="number"
                  name="usage_limit"
                  value={form.usage_limit}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Validity Period Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Thời gian hiệu lực</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Ngày bắt đầu</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  name="valid_from"
                  value={form.valid_from}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Ngày kết thúc</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  name="valid_until"
                  value={form.valid_until}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label
                htmlFor="is_active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Kích hoạt mã giảm giá ngay
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
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
