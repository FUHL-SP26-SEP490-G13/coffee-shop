import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { adminFlashSaleService } from "@/services/adminFlashSaleService";
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
import AdminFlashSaleModal from "./AdminFlashSaleModal";

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

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
              Quản lý Flash Sale
            </h1>
          </div>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" /> Tạo chiến dịch mới
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 dark:border-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 font-medium">
            <tr>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700">STT</th>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700">Chiến dịch</th>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700">Thời gian</th>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700">Khuyến mãi</th>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700">Trạng thái</th>
              <th className="py-4 px-6 border-b border-gray-100 dark:border-gray-700 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400">Đang tải dữ liệu...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400">Chưa có chiến dịch Flash Sale nào</td>
              </tr>
            ) : (
              sales.map((sale, index) => (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors">
                  <td className="py-4 px-6">{index + 1}</td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{sale.title}</td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-green-500" /> Bắt đầu: {formatDateTime(sale.start_time)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /> Kết thúc: {formatDateTime(sale.end_time)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Giảm {sale.discount_percent}%</span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(sale)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(sale)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Sửa chiến dịch"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(sale)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa chiến dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
