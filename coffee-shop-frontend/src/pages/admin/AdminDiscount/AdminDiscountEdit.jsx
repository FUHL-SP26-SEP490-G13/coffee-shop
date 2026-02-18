import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import discountService from "@/services/discountService";

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
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const d = await discountService.getById(id);
        setForm({
          code: d.code,
          description: d.description || "",
          percentage: d.percentage,
          min_order_amount: d.min_order_amount ?? 0,
          max_discount_amount: d.max_discount_amount ?? "",
          usage_limit: d.usage_limit ?? "",
          valid_from: d.valid_from ? d.valid_from.slice(0, 16) : "",
          valid_until: d.valid_until ? d.valid_until.slice(0, 16) : "",
          is_active: !!d.is_active,
        });
      } catch (e) {
        alert("Không tìm thấy discount");
        navigate("/admin/discounts");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

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
      await discountService.update(id, {
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

      alert("Cập nhật thành công");
      navigate("/admin/discounts");
    } catch (e) {
      alert("Cập nhật thất bại");
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl mb-6">Chỉnh sửa mã giảm giá</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Mã code"
          className="border p-2 w-full rounded"
        />

        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Mô tả"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="percentage"
          value={form.percentage}
          onChange={handleChange}
          placeholder="Phần trăm (%)"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="min_order_amount"
          value={form.min_order_amount}
          onChange={handleChange}
          placeholder="Đơn tối thiểu"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="max_discount_amount"
          value={form.max_discount_amount}
          onChange={handleChange}
          placeholder="Giảm tối đa (optional)"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="usage_limit"
          value={form.usage_limit}
          onChange={handleChange}
          placeholder="Giới hạn lượt dùng (optional)"
          className="border p-2 w-full rounded"
        />

        <input
          type="datetime-local"
          name="valid_from"
          value={form.valid_from}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          type="datetime-local"
          name="valid_until"
          value={form.valid_until}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Kích hoạt
        </label>

        <div className="flex gap-4">
          <Button type="submit">Cập nhật</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/discounts")}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
