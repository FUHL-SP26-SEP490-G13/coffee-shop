import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Table as TableIcon,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import tableService from "@/services/tableService";
import areaService from "@/services/areaService";
import TableModal from "./TableModal";

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesRes, areasRes] = await Promise.all([
        tableService.getAll(),
        areaService.getAll()
      ]);
      setTables(tablesRes.data || []);
      setAreas(areasRes.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setSelectedTable(null);
    setIsModalOpen(true);
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await tableService.delete(tableToDelete.id);
      toast.success("Xóa bàn thành công");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Xóa bàn thất bại");
    } finally {
      setDeleteConfirmOpen(false);
      setTableToDelete(null);
    }
  };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.table_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedAreaId === "all" || table.area_id.toString() === selectedAreaId;
    return matchesSearch && matchesArea;
  });

  const totalPages = Math.ceil(filteredTables.length / limit);
  const paginatedTables = filteredTables.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedAreaId]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Quản lý bàn</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Thêm bàn mới
          </Button>
        </div>
      </div>

      {/* FILTERS & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 lg:col-span-3 flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm theo số bàn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full bg-white/50"
            />
          </div>
          <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
            <SelectTrigger className="h-10 w-full md:w-64 bg-white/50">
              <SelectValue placeholder="Chọn khu vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khu vực</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id.toString()}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 flex flex-col justify-center bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Tổng số bàn:</span>
            <span className="font-bold text-primary">{filteredTables.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground font-medium">Đang trống:</span>
            <span className="font-bold text-green-600">
              {filteredTables.filter(t => t.status === 'available').length}
            </span>
          </div>
        </Card>
      </div>

      {/* TABLES GRID */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {paginatedTables.length > 0 ? (
            paginatedTables.map((table) => (
              <Card 
                key={table.id} 
                className="relative group p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card border-border/50 hover:border-primary/50 cursor-default overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  table.status === 'available' ? 'bg-green-500' : 
                  table.status === 'occupied' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 shadow-sm" 
                    onClick={() => handleEdit(table)}
                  >
                    <TableIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 text-destructive shadow-sm" 
                    onClick={() => handleDeleteClick(table)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Table Identity */}
                <div className={`min-w-[4rem] h-16 px-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${
                  table.status === 'available' ? 'bg-green-50' : 
                  table.status === 'occupied' ? 'bg-blue-50' : 'bg-amber-50'
                }`}>
                  <span className={`text-xl font-black tracking-tighter whitespace-nowrap ${
                    table.status === 'available' ? 'text-green-700' : 
                    table.status === 'occupied' ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {table.table_number.replace('Table ', '').replace('Bàn ', '')}
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{table.table_number}</h3>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{table.area_name}</p>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                  table.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : 
                  table.status === 'occupied' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    table.status === 'available' ? 'bg-green-500' : 
                    table.status === 'occupied' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  {table.status === 'available' ? 'Trống' : table.status === 'occupied' ? 'Có khách' : 'Đã đặt'}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 bg-muted/30 rounded-3xl border-2 border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium text-lg">Không tìm thấy bàn nào phù hợp</p>
              <Button variant="outline" onClick={() => {setSearchTerm(""); setSelectedAreaId("all");}}>
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>

          <div className="flex items-center text-sm font-medium">
            Trang {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={selectedTable}
        areas={areas}
        onSuccess={fetchData}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bàn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bàn <strong>{tableToDelete?.table_number}</strong> ({tableToDelete?.area_name})?
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
