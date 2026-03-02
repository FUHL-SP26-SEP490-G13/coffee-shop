import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  MapPin,
  Loader2,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import areaService from "@/services/areaService";
import AreaModal from "./AreaModal";

export default function AdminAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 5;

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await areaService.getAll();
      setAreas(response.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khu vực");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleAdd = () => {
    setSelectedArea(null);
    setIsModalOpen(true);
  };

  const handleEdit = (area) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (area) => {
    setAreaToDelete(area);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await areaService.delete(areaToDelete.id);
      toast.success("Xóa khu vực thành công");
      fetchAreas();
    } catch (error) {
      toast.error(error.message || "Xóa khu vực thất bại");
    } finally {
      setDeleteConfirmOpen(false);
      setAreaToDelete(null);
    }
  };

  const filteredAreas = areas.filter((area) =>
    area.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAreas.length / limit);
  const paginatedAreas = filteredAreas.slice((page - 1) * limit, page * limit);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="mb-6 flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold mb-1">Quản lý khu vực</h1>
        </div>


        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* TABLE CARD */}
      <Card className="p-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Tìm theo tên khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3 border">ID</th>
                  <th className="p-3 border">Tên khu vực</th>
                  <th className="p-3 border text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAreas.length > 0 ? (
                  paginatedAreas.map((area) => (
                    <tr key={area.id}>
                      <td className="p-3 border font-medium">#{area.id}</td>
                      <td className="p-3 border">{area.name}</td>
                      <td className="p-3 border">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(area)}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(area)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-muted-foreground">
                      Không tìm thấy khu vực nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="px-3 py-1">
            {page} / {totalPages || 1}
          </span>

          <Button
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      <AreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        area={selectedArea}
        onSuccess={fetchAreas}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khu vực</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khu vực <strong>{areaToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

