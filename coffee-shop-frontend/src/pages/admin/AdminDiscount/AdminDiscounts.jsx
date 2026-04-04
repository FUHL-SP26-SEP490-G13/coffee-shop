import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Plus,
  Ticket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import discountService from "@/services/discountService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PaginationControl from "@/components/common/PaginationControl";

export default function AdminDiscounts() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const abortRef = useRef(null);
  const navigate = useNavigate();

  const PAGE_SIZE = 7;

  const fetchDiscounts = async (
    currentPage = page,
    search = keyword,
    status = statusFilter
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await discountService.getAll(
        {
          page: currentPage,
          limit: PAGE_SIZE,
          code: search,
          status,
        },
        controller.signal
      );

      const payload = res?.data || res;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || payload.totalCount || 0);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Lỗi lấy danh sách discount:", err);
        setError("Không thể tải danh sách mã giảm giá");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDiscounts(page, keyword, statusFilter);
    }, 600);

    return () => clearTimeout(timeout);
  }, [keyword, statusFilter, page]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

    try {
      setLoadingId(id);
      await discountService.delete(id);
      toast.success("Xóa mã giảm giá thành công");
      await fetchDiscounts(page, keyword, statusFilter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusInfo = (item) => {
    const now = Date.now();
    const startTime = item.valid_from
      ? new Date(item.valid_from).getTime()
      : null;
    const endTime = item.valid_until
      ? new Date(item.valid_until).getTime()
      : null;

    if (startTime && now < startTime) {
      return {
        text: "Sắp diễn ra",
        variant: "outline",
      };
    }

    if (endTime && now >= endTime) {
      return {
        text: "Hết hạn",
        variant: "destructive",
      };
    }

    return {
      text: "Còn hiệu lực",
      variant: "secondary",
    };
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return Number(value).toLocaleString("vi-VN") + "đ";
  };

  if (error && data.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchDiscounts(1, "", "")}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Quản lý mã giảm giá
              </h2>
            </div>
          </div>

          <Button onClick={() => navigate("/admin/discounts/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Mới
          </Button>
        </div>

        {/* FILTER */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo code, mô tả hoặc %..."
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
              className="pl-9"
            />
          </div>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Còn hiệu lực</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp diễn ra</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="relative bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-[60px]">STT</TableHead>
                <TableHead className="min-w-[180px]">Mã giảm giá</TableHead>
                <TableHead className="text-center min-w-[100px]">%</TableHead>
                <TableHead className="text-center min-w-[130px]">
                  Đơn tối thiểu
                </TableHead>
                <TableHead className="text-center min-w-[130px]">
                  Giảm tối đa
                </TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Sử dụng
                </TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center min-w-[140px]">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có mã giảm giá nào
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const status = getStatusInfo(item);
                  const stt = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium">
                        {stt}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-medium">{item.code}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        {Number(item.percentage || 0)}%
                      </TableCell>

                      <TableCell className="text-center">
                        {formatMoney(item.min_order_amount)}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatMoney(item.max_discount_amount)}
                      </TableCell>

                      <TableCell className="text-center">
                        {Number(item.used_count || 0)} /{" "}
                        {item.usage_limit == null
                          ? "∞"
                          : Number(item.usage_limit)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={status.variant}
                          className="inline-flex min-w-[110px] justify-center"
                        >
                          {status.text}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/discounts/edit/${item.id}`)
                            }
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={loadingId === item.id}
                            title="Xóa"
                            className="hover:text-red-600"
                          >
                            {loadingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* PAGINATION */}
      {!isLoading && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          itemName="mã giảm giá"
        />
      )}
    </div>
  );
}
