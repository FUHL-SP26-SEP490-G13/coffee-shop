import { useState } from "react";
import { useNavigate } from "react-router-dom";
import discountService from "@/services/discountService";

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
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl mb-6">Tạo mã giảm giá mới</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Mã code</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Mô tả</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Phần trăm (%)</label>
          <input
            type="number"
            name="percentage"
            value={form.percentage}
            onChange={handleChange}
            required
            min="1"
            max="100"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Đơn tối thiểu</label>
          <input
            type="number"
            name="min_order_amount"
            value={form.min_order_amount}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Giảm tối đa (optional)
          </label>
          <input
            type="number"
            name="max_discount_amount"
            value={form.max_discount_amount}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Giới hạn lượt dùng (optional)
          </label>
          <input
            type="number"
            name="usage_limit"
            value={form.usage_limit}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Ngày bắt đầu (valid_from)
          </label>
          <input
            type="datetime-local"
            name="valid_from"
            value={form.valid_from}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Ngày kết thúc (valid_until)
          </label>
          <input
            type="datetime-local"
            name="valid_until"
            value={form.valid_until}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label>Kích hoạt</label>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            {loading ? "Đang tạo..." : "Tạo"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/discounts")}
            className="border px-6 py-2 rounded"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
