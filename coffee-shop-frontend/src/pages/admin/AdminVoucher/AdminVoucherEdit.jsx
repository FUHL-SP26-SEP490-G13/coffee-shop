import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import voucherService from "@/services/voucherService";

export default function AdminVoucherEdit() {
  const { id } = useParams();
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

  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu voucher
  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const data = await voucherService.getById(id);
        console.log("DETAIL DATA:", data);
        setForm({
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_order_value: data.min_order_value,
          max_discount: data.max_discount,
          usage_limit: data.usage_limit,
          start_date: data.start_date?.slice(0, 16),
          end_date: data.end_date?.slice(0, 16),
          is_active: data.is_active,
        });
      } catch (err) {
        alert("Không tìm thấy voucher");
        navigate("/admin/vouchers");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
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
      await voucherService.update(id, form);
      alert("Cập nhật thành công");
      navigate("/admin/vouchers");
    } catch (err) {
      alert("Cập nhật thất bại");
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl mb-6">Chỉnh sửa Voucher</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Mã voucher"
          className="border p-2 w-full rounded"
        />

        <select
          name="discount_type"
          value={form.discount_type}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        >
          <option value="percent">Giảm %</option>
          <option value="fixed">Giảm tiền</option>
        </select>

        <input
          type="number"
          name="discount_value"
          value={form.discount_value}
          onChange={handleChange}
          placeholder="Giá trị giảm"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="min_order_value"
          value={form.min_order_value}
          onChange={handleChange}
          placeholder="Đơn tối thiểu"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="max_discount"
          value={form.max_discount ?? ""}
          onChange={handleChange}
          placeholder="Giảm tối đa (nếu có)"
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="usage_limit"
          value={form.usage_limit || ""}
          onChange={handleChange}
          placeholder="Giới hạn lượt dùng"
          className="border p-2 w-full rounded"
        />

        <input
          type="datetime-local"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          type="datetime-local"
          name="end_date"
          value={form.end_date}
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
            onClick={() => navigate("/admin/vouchers")}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
