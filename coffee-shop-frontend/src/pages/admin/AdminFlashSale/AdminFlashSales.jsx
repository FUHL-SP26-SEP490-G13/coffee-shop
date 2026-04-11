import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Clock, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { adminFlashSaleService } from "@/services/adminFlashSaleService";
import PaginationControl from "@/components/common/PaginationControl";
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
import AdminFlashSaleModal from "./AdminFlashSaleModal";

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await adminFlashSaleService.getAll();
      setSales(res?.data || []);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSales = sales.filter(sale =>
    sale.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setSelectedSale(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (sale) => {
    try {
      toast.loading("Đang tải chi tiết...");
      const res = await adminFlashSaleService.getById(sale.id);
      toast.dismiss();
      setSelectedSale(res.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.dismiss();
      toast.error("Không thể tải chi tiết");
    }
  };

  const handleDeleteConfirm = (sale) => {
    setSaleToDelete(sale);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    try {
      toast.loading("Đang xóa...");
      await adminFlashSaleService.delete(saleToDelete.id);
      toast.success("Xóa flash sale thành công");
      fetchSales();
    } catch (error) {
      toast.error(error.message || "Lỗi khi xóa");
    } finally {
      toast.dismiss();
      setDeleteConfirmOpen(false);
      setSaleToDelete(null);
    }
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getStatusBadge = (sale) => {
    const now = new Date();
    const start = new Date(sale.start_time);
    const end = new Date(sale.end_time);

    if (sale.status === 'inactive') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Đã tắt</span>;
    }

    if (now < start) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">Sắp diễn ra</span>;
    } else if (now > end) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Đã kết thúc</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-bold animate-pulse">Đang diễn ra</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              Quản lý flash sale
            </h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Tìm kiếm chiến dịch..."
              className="pl-9 w-full sm:w-[350px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" /> Tạo chiến dịch mới
          </Button>
        </div>
      </div>

      <div className="relative bg-card rounded-xl border border-border overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-[60px]">STT</TableHead>
                <TableHead className="min-w-[180px]">Chiến dịch</TableHead>
                <TableHead className="min-w-[200px]">Thời gian</TableHead>
                <TableHead className="text-center min-w-[120px]">Khuyến mãi</TableHead>
                <TableHead className="text-center min-w-[120px]">Trạng thái</TableHead>
                <TableHead className="text-center min-w-[140px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không tìm thấy chiến dịch Flash Sale nào
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, index) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-center font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{sale.title}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-green-500" /> Bắt đầu: {formatDateTime(sale.start_time)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /> Kết thúc: {formatDateTime(sale.end_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Giảm {sale.discount_percent}%</span>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(sale)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(sale)}
                          title="Sửa chiến dịch"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfirm(sale)}
                          title="Xóa chiến dịch"
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {!loading && filteredSales.length > 0 && (
          <div className="p-4 border-t border-border">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredSales.length}
              itemsPerPage={itemsPerPage}
              itemName="chiến dịch"
            />
          </div>
        )}
      </div>

      <AdminFlashSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        saleData={selectedSale}
        onSuccess={fetchSales}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa Flash Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chiến dịch <strong>{saleToDelete?.title}</strong>? Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa chiến dịch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
