import { useEffect, useState } from "react";
import { Plus, Percent, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import voucherService from "@/services/voucherService";
import { useNavigate } from "react-router-dom";

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchCode, setSearchCode] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [debouncedCode, setDebouncedCode] = useState(""); // ← thêm state này

  const navigate = useNavigate();

  const fetchVouchers = async () => {
    try {
      setLoading(true);

      const res = await voucherService.getAll({
        page,
        code: debouncedCode, // ← đổi từ searchCode
        type: typeFilter,
      });

      setVouchers(res.items);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce: chờ 500ms sau khi người dùng ngừng gõ mới cập nhật
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(searchCode);
    }, 500);

    return () => clearTimeout(timer); // hủy timer nếu gõ tiếp
  }, [searchCode]);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedCode, typeFilter]); // ← dùng debouncedCode

  // Gọi API khi page hoặc filter thay đổi
  useEffect(() => {
    fetchVouchers();
  }, [page, debouncedCode, typeFilter]); // ← dùng debouncedCode

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa voucher?")) return;

    try {
      await voucherService.delete(id);
      fetchVouchers(); // reload lại page hiện tại
    } catch (error) {
      alert("Xóa thất bại");
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải voucher...</div>;
  }

  return (
    <div className="p-6">
      {/* Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm theo mã..."
          className="border px-3 py-2 rounded w-64"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="percent">% Giảm giá</option>
          <option value="fixed">Giảm tiền</option>
        </select>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">Voucher Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage promotional codes
          </p>
        </div>

        <Button onClick={() => navigate("/admin/vouchers/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mã giảm giá
        </Button>
      </div>

      {vouchers.length === 0 ? (
        <div className="text-center text-muted-foreground">
          Không có voucher
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {vouchers.map((voucher) => {
              const usagePercentage =
                voucher.usage_limit > 0
                  ? (voucher.used_count / voucher.usage_limit) * 100
                  : 0;

              const daysUntilExpiry = Math.ceil(
                (new Date(voucher.end_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={voucher.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {voucher.discount_type === "percent" ? (
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Percent className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                          <DollarSign className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="text-sm mb-1">
                          {voucher.discount_type === "percent"
                            ? `${voucher.discount_value}% OFF`
                            : `${Number(
                                voucher.discount_value
                              ).toLocaleString()}đ OFF`}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Min order:{" "}
                          {Number(voucher.min_order_value).toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    <Badge variant="secondary">
                      {daysUntilExpiry > 0
                        ? `${daysUntilExpiry} ngày`
                        : "Hết hạn"}
                    </Badge>
                  </div>

                  <div className="bg-secondary rounded-lg p-3 mb-3">
                    <div className="font-mono text-lg text-center">
                      {voucher.code}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span>
                        {voucher.used_count} / {voucher.usage_limit || "∞"}
                      </span>
                    </div>
                    <Progress value={usagePercentage} />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        navigate(`/admin/vouchers/edit/${voucher.id}`)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(voucher.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Trang trước
            </Button>

            <span className="text-sm">
              Trang {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Trang sau
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
