import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Edit,
  Newspaper,
  Plus,
} from "lucide-react";
import newsService from "@/services/newsService";
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

const PAGE_SIZE = 7;

export default function AdminNewsList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const fetchNews = async (currentPage = 1, search = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await newsService.getAllAdmin(currentPage, search);
      const payload = res.data?.data || res.data;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
    } catch (error) {
      console.error("Lỗi lấy danh sách tin:", error);
      setError("Không thể tải danh sách bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNews(page, keyword);
    }, 600);

    return () => clearTimeout(timeout);
  }, [page, keyword]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      setLoadingId(id);

      await newsService.delete(id);
      toast.success("Xóa bài viết thành công");

      if (data.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchNews(page, keyword);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  if (error && data.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setPage(1);
            setKeyword("");
            fetchNews(1, "");
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-1">Quản lý bài viết</h2>
              <p className="text-sm text-muted-foreground">
                Tạo và quản lý bài viết của bạn
              </p>
            </div>
          </div>

          <Button onClick={() => navigate("/admin/create-news")}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Mới
          </Button>
        </div>

        <Input
          placeholder="Tìm theo tiêu đề hoặc tag..."
          value={keyword}
          onChange={handleSearchChange}
          className="pl-9"
        />
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
                <TableHead className="w-[5%] text-center">STT</TableHead>
                <TableHead className="w-[45%] min-w-[280px]">Tiêu đề</TableHead>
                <TableHead className="w-[10%] min-w-[100px] text-center">
                  Lượt xem
                </TableHead>
                <TableHead className="w-[15%] min-w-[130px] text-center">
                  Tag
                </TableHead>
                <TableHead className="w-[15%] min-w-[140px] text-center">
                  Ngày tạo
                </TableHead>
                <TableHead className="w-[15%] min-w-[160px] text-center">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có bài viết nào
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

                      <TableCell className="max-w-[0] truncate">
                        {item.title}
                      </TableCell>

                      <TableCell className="text-center">
                        {item.views ?? 0}
                      </TableCell>

                      <TableCell className="text-center">
                        {item.tag ? (
                          <Badge
                            variant="secondary"
                            className="capitalize inline-flex min-w-[70px] justify-center"
                          >
                            {item.tag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm inline-block text-center">
                            Chưa có tag
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground text-sm">
                        {new Date(item.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/news-detail/${item.slug}`)
                            }
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/edit-news/${item.id}`)
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

      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;

                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
