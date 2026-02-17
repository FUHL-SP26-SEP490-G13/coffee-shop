import { useState } from "react";
import { useNavigate } from "react-router-dom";
import voucherService from "@/services/voucherService";

export default function AdminVoucherCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await voucherService.create({
        ...form,
        discount_value: Number(form.discount_value),
        min_order_value: Number(form.min_order_value),
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });

      alert("Tạo voucher thành công");
      navigate("/admin/vouchers");
    } catch (error) {
      console.error(error);
      alert("Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Tạo Voucher mới</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code */}
        <div>
          <label className="block mb-1 font-medium">Mã voucher</label>
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Discount Type */}
        <div>
          <label className="block mb-1 font-medium">Loại giảm giá</label>
          <select
            name="discount_type"
            value={form.discount_type}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Tiền cố định</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block mb-1 font-medium">Giá trị giảm</label>
          <input
            type="number"
            name="discount_value"
            value={form.discount_value}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Min Order */}
        <div>
          <label className="block mb-1 font-medium">Đơn tối thiểu</label>
          <input
            type="number"
            name="min_order_value"
            value={form.min_order_value}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Max Discount */}
        {form.discount_type === "percent" && (
          <div>
            <label className="block mb-1 font-medium">Giảm tối đa</label>
            <input
              type="number"
              name="max_discount"
              value={form.max_discount}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        {/* Usage Limit */}
        <div>
          <label className="block mb-1 font-medium">Giới hạn lượt dùng</label>
          <input
            type="number"
            name="usage_limit"
            value={form.usage_limit}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block mb-1 font-medium">Ngày bắt đầu</label>
          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block mb-1 font-medium">Ngày kết thúc</label>
          <input
            type="datetime-local"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label>Kích hoạt ngay</label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            {loading ? "Đang tạo..." : "Tạo voucher"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/vouchers")}
            className="border px-6 py-2 rounded"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
