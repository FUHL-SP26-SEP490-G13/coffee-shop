import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Eye, Edit, Mail, Newspaper } from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminNewsList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [searchTitle, setSearchTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNews = async (currentPage = page, title = searchTitle) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await newsService.getAllAdmin(currentPage, title);
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
    fetchNews(page, searchTitle);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchNews(1, searchTitle);
  };

  const handleReset = () => {
    setSearchTitle("");
    setPage(1);
    fetchNews(1, "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      setLoadingId(id);
      await newsService.delete(id);
      fetchNews(page, searchTitle);
    } catch (error) {
      alert("Xóa thất bại");
      setLoadingId(null);
    }
  };

  if (error && data.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>
        <Button variant="outline" className="mt-4" onClick={() => fetchNews(1, "")}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold mb-1">Quản lý bài viết</h1>
          </div>
          <Button onClick={() => navigate("/admin/create-news")}>
            + Thêm bài viết
          </Button>
        </div>

        {/* SEARCH */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>

          <Button onClick={handleSearch}>Tìm kiếm</Button>

          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead className="w-[150px]">Ngày tạo</TableHead>
                <TableHead className="text-right w-[200px]">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có bài viết nào
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-[400px] truncate">
                      {item.title}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
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
                        onClick={() => navigate(`/admin/edit-news/${item.id}`)}
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* PAGINATION */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
