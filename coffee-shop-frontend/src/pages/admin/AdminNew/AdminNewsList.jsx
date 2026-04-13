import { useEffect, useState } from "react";
import {
  Loader2,
  Trash2,
  Edit,
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
import PaginationControl from "@/components/common/PaginationControl";
import AdminNewsModal from "./AdminNewsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 7;

export default function AdminNewsList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchNews = async (currentPage = 1, search = "", sort = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await newsService.getAllAdmin(currentPage, search, sort);
      const payload = res.data?.data || res.data;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || payload.totalCount || 0);
    } catch (error) {
      console.error("Lỗi lấy danh sách tin:", error);
      setError("Không thể tải danh sách bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNews(page, keyword, sortOrder);
    }, 600);

    return () => clearTimeout(timeout);
  }, [page, keyword, sortOrder]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setPage(1);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      setLoadingId(deleteId);
      setDeleteConfirmOpen(false);

      await newsService.delete(deleteId);
      toast.success("Xóa bài viết thành công");

      if (data.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchNews(page, keyword, sortOrder);
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi xóa bài viết");
    } finally {
      setLoadingId(null);
      setDeleteId(null);
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
            setSortOrder("");
            fetchNews(1, "", "");
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
            <div>
              <h2 className="text-xl font-semibold">Quản lý bài viết</h2>
            </div>
          </div>

          <Button onClick={() => {
            setSelectedNewsId(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Mới
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Tìm theo tiêu đề hoặc tag..."
            value={keyword}
            onChange={handleSearchChange}
            className="pl-9 flex-1"
          />

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[200px]"
          >
            <option value="">Ngày tạo mới nhất</option>
            <option value="views_desc">Lượt xem (Cao - Thấp)</option>
            <option value="views_asc">Lượt xem (Thấp - Cao)</option>
          </select>
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
                            onClick={() => {
                              setSelectedNewsId(item.id);
                              setIsModalOpen(true);
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(item.id)}
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

      {!isLoading && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          itemName="bài viết"
        />
      )}

      <AdminNewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNewsId(null);
        }}
        newsId={selectedNewsId}
        onSuccess={() => fetchNews(page, keyword, sortOrder)}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết <strong>{data.find((item) => item.id === deleteId)?.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingId !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loadingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
