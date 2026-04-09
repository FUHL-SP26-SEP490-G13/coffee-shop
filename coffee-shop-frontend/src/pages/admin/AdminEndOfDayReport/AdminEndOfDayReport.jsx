import { useEffect, useState, useRef } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Printer, 
  FileText,
  Loader2,
  ChevronRight,
  Plus,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import adminDBService from "../../../services/adminDBService";

const AdminEndOfDayReport = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [filterType, setFilterType] = useState("7days");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set([0])); // Start with first group expanded

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const start = format(startOfDay(dateRange.from), "yyyy-MM-dd HH:mm:ss");
      const end = format(endOfDay(dateRange.to), "yyyy-MM-dd HH:mm:ss");
      
      const res = await adminDBService.getDetailedReport(start, end);
      // Since the service already returns the data (array), we set it directly
      if (Array.isArray(res)) {
        setData(res);
      } else if (res && res.success && Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const handleFilterChange = (value) => {
    setFilterType(value);
    const today = new Date();
    switch (value) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "7days":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "30days":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "thisMonth":
        setDateRange({
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: today,
        });
        break;
      default:
        break;
    }
  };

  const totals = data.reduce((acc, curr) => ({
    qty: acc.qty + (Number(curr.totalQuantity) || 0),
    itemsPrice: acc.itemsPrice + (Number(curr.totalItemsPrice) || 0),
    discount: acc.discount + (Number(curr.discount) || 0),
    delivery: acc.delivery + (Number(curr.deliveryFee) || 0),
    revenue: acc.revenue + (Number(curr.revenue) || 0),
    collected: acc.collected + (Number(curr.actualCollected) || 0),
    debt: acc.debt + (Number(curr.debt) || 0),
  }), { qty: 0, itemsPrice: 0, discount: 0, delivery: 0, revenue: 0, collected: 0, debt: 0 });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50/50 print:bg-white print:p-0">
      {/* Header - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo tổng kết</h1>
          <p className="text-muted-foreground">Chi tiết giao dịch và doanh thu theo thời gian</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            In báo cáo
          </Button>

          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="yesterday">Hôm qua</SelectItem>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="custom">Tùy chọn</SelectItem>
            </SelectContent>
          </Select>

          {filterType === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold uppercase">Báo cáo tổng kết doanh thu</h1>
        <p className="mt-2 text-sm">
          Từ ngày: {format(dateRange.from, "dd/MM/yyyy")} - Đến ngày: {format(dateRange.to, "dd/MM/yyyy")}
        </p>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#bce4f5] border-b font-medium text-slate-900">
                <th className="px-4 py-3 text-left">Mã chứng từ</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Nhân viên</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">T.Toán</th>
                <th className="px-4 py-3 text-right">SL</th>
                <th className="px-4 py-3 text-right">Tổng tiền hàng</th>
                <th className="px-4 py-3 text-right">Giảm giá</th>
                <th className="px-4 py-3 text-right">Phí ship</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right">Thực thu</th>
                <th className="px-4 py-3 text-right">Ghi nợ</th>
              </tr>
            </thead>
            <tbody>
              {/* Grouping row (Mocking the "Hóa đơn: 7" row from screenshot) */}
              <tr className="bg-[#fefce8] font-medium border-b cursor-pointer hover:bg-[#fff9c4] transition-colors"
                  onClick={() => {
                    const next = new Set(expandedRows);
                    if (next.has(0)) next.delete(0);
                    else next.add(0);
                    setExpandedRows(next);
                  }}>
                <td className="px-4 py-3 flex items-center gap-2">
                  {expandedRows.has(0) ? (
                    <Minus className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Plus className="h-4 w-4 text-slate-500" />
                  )}
                  Hóa đơn: {data.length}
                </td>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-right">{totals.qty}</td>
                <td className="px-4 py-3 text-right">{totals.itemsPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{totals.discount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-blue-600">{totals.delivery.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{totals.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold">{totals.collected.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-600">{totals.debt.toLocaleString()}</td>
              </tr>

              {expandedRows.has(0) && data.map((order) => (
                <tr key={order.orderId} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">#{order.orderId}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.staffName}</td>
                  <td className="px-4 py-3">{format(new Date(order.time), "HH:mm dd/MM")}</td>
                  <td className="px-4 py-3 capitalize">{order.paymentMethod}</td>
                  <td className="px-4 py-3 text-right">{order.totalQuantity}</td>
                  <td className="px-4 py-3 text-right">{Number(order.totalItemsPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-500">{Number(order.discount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{Number(order.deliveryFee).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium">{Number(order.revenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-700">{Number(order.actualCollected).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600">{Number(order.debt).toLocaleString()}</td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500 italic">
                    Không tìm thấy dữ liệu trong khoảng thời gian này
                  </td>
                </tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2">
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-900 border-r">TỔNG CỘNG</td>
                  <td className="px-4 py-4 text-right border-r">{totals.qty}</td>
                  <td className="px-4 py-4 text-right border-r">{totals.itemsPrice.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right border-r text-red-500">{totals.discount.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right border-r text-blue-600">{totals.delivery.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right border-r">{totals.revenue.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right border-r text-green-700">{totals.collected.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right text-red-600">{totals.debt.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:flex flex-col items-end gap-1 mt-8 border-t pt-4">
        <p className="font-bold">Người lập biểu</p>
        <p className="text-xs text-slate-500 mt-12">(Ký và ghi rõ họ tên)</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block *, table, table *, .print\\:flex, .print\\:flex * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          table {
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px !important;
          }
          th {
            background-color: #bce4f5 !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-\\[\\#fefce8\\] {
            background-color: #fefce8 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}} />
    </div>
  );
};

export default AdminEndOfDayReport;
