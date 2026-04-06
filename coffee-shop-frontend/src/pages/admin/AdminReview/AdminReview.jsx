import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
} from "lucide-react";
import reviewService from "@/services/reviewService";
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
import PaginationControl from "@/components/common/PaginationControl";

export default function AdminReviews() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");

  const abortRef = useRef(null);

  const PAGE_SIZE = 7;

  const fetchReviews = async (currentPage = page, search = keyword) => {
    try {
      setIsLoading(true);
      setError(null);

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await reviewService.getAll(
        {
          page: currentPage,
          limit: PAGE_SIZE,
          keyword: search,
        },
        controller.signal
      );

      const payload = res?.data || res;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || payload.totalCount || 0);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Lỗi lấy danh sách review:", err);
        setError("Không thể tải danh sách review");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReviews(page, keyword);
    }, 600);

    return () => clearTimeout(timeout);
  }, [keyword, page]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < Number(rating)
                ? "text-amber-500 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (error && data.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchReviews(1, "")}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">Quản lý đánh giá</h2>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo sản phẩm, người dùng, bình luận hoặc số sao..."
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

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
                <TableHead className="min-w-[180px]">Người đánh giá</TableHead>
                <TableHead className="min-w-[180px]">Sản phẩm</TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Số sao
                </TableHead>
                <TableHead className="min-w-[260px]">Bình luận</TableHead>
                <TableHead className="text-center min-w-[140px]">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center min-w-[170px]">
                  Ngày tạo
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có review nào
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const stt = (page - 1) * PAGE_SIZE + index + 1;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium">
                        {stt}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{item.full_name}</div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        {renderStars(item.rating)}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[320px] whitespace-normal break-words text-sm text-gray-700">
                          {item.comment || "—"}
                          {item.images && item.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.images.map((img, idx) => (
                                <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-80 transition-opacity">
                                  <img src={img.url} alt="Review attachment" className="w-10 h-10 rounded border border-gray-200 object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={item.is_edited ? "secondary" : "outline"}
                          className="inline-flex min-w-[110px] justify-center"
                        >
                          {item.is_edited ? "Đã chỉnh sửa" : "Mới"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("vi-VN")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          itemName="đánh giá"
        />
      )}
    </div>
  );
}
