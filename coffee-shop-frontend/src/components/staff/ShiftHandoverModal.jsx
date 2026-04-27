import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cashSessionService from "@/services/cashSessionService";
import { toast } from "sonner";
import { format } from "date-fns";

export function ShiftHandoverModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, startDate, endDate, currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await cashSessionService.getMyHistory(params);
      if (res?.success) {
        const data = res.data;
        setHistory(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        if (data?.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || 0);
        }
      }
    } catch (error) {
      toast.error("Không thể tải danh sách phiếu bàn giao ca");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (amount == null) return "---";
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "---";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1000px] w-[95vw] h-[80vh] flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Phiếu bàn giao ca</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Lọc cơ bản cho nhân viên (chỉ gồm ngày) */}
          <div className="flex-shrink-0 flex gap-4 items-center bg-accent/50 p-4 rounded-lg">
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm text-muted-foreground font-medium">Từ ngày</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex flex-col gap-1 w-48">
              <label className="text-sm text-muted-foreground font-medium">Đến ngày</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              />
            </div>
            {loading && <span className="text-sm text-muted-foreground mt-6 ml-4">Đang tải...</span>}
          </div>

          <div className="flex-1 min-h-0 overflow-auto border rounded-xl bg-card">
            <Table>
              <TableHeader className="sticky top-0 bg-accent z-10">
                <TableRow>
                  <TableHead className="w-24 border-r border-border">Mã ca</TableHead>
                  <TableHead className="border-r border-border min-w-[150px]">Thời gian mở ca</TableHead>
                  <TableHead className="border-r border-border min-w-[150px]">Thời gian đóng ca</TableHead>
                  <TableHead className="text-right border-r border-border">Tiền mặt đầu ca</TableHead>
                  <TableHead className="text-right border-r border-border">Tiền mặt cuối ca</TableHead>
                  <TableHead className="text-right border-r border-border">Bàn giao thực tế</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                      Không có phiếu bàn giao nào
                    </TableCell>
                  </TableRow>
                )}
                {history.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-medium text-primary border-r border-border/50">
                      {item.code || `CA00000${item.id}`}
                    </TableCell>
                    <TableCell className="border-r border-border/50">{formatDateTime(item.opened_at)}</TableCell>
                    <TableCell className="border-r border-border/50">{formatDateTime(item.closed_at)}</TableCell>
                    <TableCell className="text-right font-medium border-r border-border/50">
                      {formatMoney(item.opening_cash)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400 border-r border-border/50">
                      {formatMoney(item.closing_cash_system)}
                    </TableCell>
                    <TableCell className="text-right font-medium border-r border-border/50">
                      {item.closing_cash_actual != null ? formatMoney(item.closing_cash_actual) : '---'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        item.cash_difference > 0
                          ? "text-emerald-500"
                          : item.cash_difference < 0
                          ? "text-rose-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.cash_difference != null ? formatMoney(item.cash_difference) : '---'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} phiếu
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium w-8 text-center">{currentPage}</span>
                  <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
