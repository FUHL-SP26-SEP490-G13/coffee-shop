import { useEffect, useRef, useState } from "react";
import { Plus, Percent, Search, Ticket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import discountService from "@/services/discountService";
import { useNavigate } from "react-router-dom";

export default function AdminDiscounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchCode, setSearchCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [filters, setFilters] = useState({
    code: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const abortRef = useRef(null);
  const navigate = useNavigate();

  const fetchDiscounts = async () => {
    try {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      const res = await discountService.getAll(
        {
          page,
          code: filters.code,
          status: filters.status,
        },
        controller.signal
      );

      setItems(res.items);
      setTotalPages(res.totalPages);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Khi đổi page
  useEffect(() => {
    fetchDiscounts();
  }, [page]);

  // Khi filter thay đổi (sau khi bấm nút)
  useEffect(() => {
    fetchDiscounts();
  }, [filters]);

  const handleSearch = () => {
    setPage(1);
    setFilters({
      code: searchCode,
      status: statusFilter,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá?")) return;

    try {
      await discountService.delete(id);
      fetchDiscounts();
    } catch (e) {
      alert("Xóa thất bại");
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Quản lý mã giảm giá</h2>
            <p className="text-sm text-muted-foreground">
              Tạo và quản lý mã giảm giá theo %
            </p>
          </div>
        </div>

        <Button onClick={() => navigate("/admin/discounts/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mã giảm giá
        </Button>
      </div>

      {/* FILTER */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã giảm giá..."
              className="pl-10"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <select
            className="border border-input rounded-md px-3 py-2 text-sm bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Còn hạn</option>
            <option value="expired">Hết hạn</option>
          </select>

          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
      </Card>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </Card>
            ))
          : items.map((d) => {
              const usagePercentage =
                d.usage_limit > 0 ? (d.used_count / d.usage_limit) * 100 : 0;

              const expired = d.valid_until
                ? new Date(d.valid_until).getTime() < Date.now()
                : false;

              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Percent className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="text-sm mb-1">{d.percentage}% OFF</div>

                        <div className="text-xs text-muted-foreground">
                          Min order:{" "}
                          {Number(d.min_order_amount || 0).toLocaleString()}đ
                        </div>

                        {d.max_discount_amount != null && (
                          <div className="text-xs text-muted-foreground">
                            Max:{" "}
                            {Number(d.max_discount_amount).toLocaleString()}đ
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge variant="secondary">
                      {d.is_active ? (expired ? "Hết hạn" : "Còn hạn") : "Tắt"}
                    </Badge>
                  </div>

                  <div className="bg-secondary rounded-lg p-3 mb-3">
                    <div className="font-mono text-lg text-center">
                      {d.code}
                    </div>
                    {d.description && (
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {d.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span>
                        {d.used_count} / {d.usage_limit || "∞"}
                      </span>
                    </div>
                    <Progress value={usagePercentage} />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/admin/discounts/edit/${d.id}`)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(d.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Trang trước
        </Button>

        <span className="text-sm">
          Trang {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
