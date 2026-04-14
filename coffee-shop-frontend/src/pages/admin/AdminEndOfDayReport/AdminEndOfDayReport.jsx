import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Printer,
  Loader2,
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

const EMPTY_TOTALS = { qty: 0, itemsPrice: 0, discount: 0, delivery: 0, revenue: 0 };
const moneyFormatter = new Intl.NumberFormat("vi-VN");

const toNumber = (value) => Number(value) || 0;

const formatMoney = (value) => moneyFormatter.format(toNumber(value));
//Định dạng nhãn cho khoảng ngày, đảm bảo hiển thị rõ ràng và dễ hiểu cho người dùng
const formatRangeLabel = (range) => {
  if (!range?.from) return "Chọn ngày";
  if (!range?.to) return `${format(range.from, "dd/MM/yyyy")} - ...`;
  return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
};

//Chuẩn hóa dữ liệu trả về từ API để đảm bảo luôn có mảng để render, tránh lỗi khi cấu trúc dữ liệu không như mong đợi
const parseReportRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.success && Array.isArray(payload.data)) return payload.data;
  return [];
};

const AdminEndOfDayReport = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [filterType, setFilterType] = useState("7days");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set([0])); // Start with first group expanded
  const isRefreshing = loading && data.length > 0;

  const fetchReportData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    try {
      setLoading(true);
      const start = format(startOfDay(dateRange.from), "yyyy-MM-dd HH:mm:ss");
      const end = format(endOfDay(dateRange.to), "yyyy-MM-dd HH:mm:ss");

      const res = await adminDBService.getDetailedReport(start, end);
      setData(parseReportRows(res));
    } catch (error) {
      console.error("Error fetching report data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (value) => {
    setFilterType(value);
    const today = new Date();
    switch (value) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday": {
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      }
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

  const rangeLabel = useMemo(() => formatRangeLabel(dateRange), [dateRange]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, curr) => ({
          qty: acc.qty + toNumber(curr.totalQuantity),
          itemsPrice: acc.itemsPrice + toNumber(curr.totalItemsPrice),
          discount: acc.discount + toNumber(curr.discount),
          delivery: acc.delivery + toNumber(curr.deliveryFee),
          revenue: acc.revenue + toNumber(curr.revenue),
        }),
        EMPTY_TOTALS
      ),
    [data]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Hóa đơn",
        value: data.length,
        tone: "from-sky-500/15 to-cyan-500/5",
      },
      {
        label: "Sản phẩm",
        value: totals.qty,
        tone: "from-emerald-500/15 to-teal-500/5",
      },
      {
        label: "Đã thu",
        value: formatMoney(totals.revenue),
        tone: "from-amber-500/15 to-orange-500/5",
      },
    ],
    [data.length, totals.qty, totals.revenue]
  );

  const handlePrint = () => {
    window.print();
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-6">
          <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
            <div className="h-6 w-48 rounded bg-muted border border-border" />
            <div className="mt-3 h-4 w-80 rounded bg-muted" />
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-10 w-36 rounded-xl bg-muted" />
              <div className="h-10 w-48 rounded-xl bg-muted" />
              <div className="h-10 w-52 rounded-xl bg-muted" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card text-card-foreground p-4 shadow-sm">
                <div className="h-3 w-24 rounded bg-muted border border-border" />
                <div className="mt-3 h-8 w-32 rounded bg-muted" />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="h-14 bg-muted" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-9 gap-3 border-t px-4 py-4">
                {Array.from({ length: 9 }).map((__, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`h-4 rounded ${cellIndex % 3 === 0 ? "bg-muted border border-border" : "bg-muted"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-shell space-y-6 p-6 min-h-screen bg-background print:bg-card text-card-foreground print:p-0">
      {/* Header - Hidden on print */}
      <div className="report-card flex items-center justify-between gap-4 rounded-2xl border bg-card text-card-foreground p-5 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-200">
            Báo cáo cuối ngày
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Báo cáo tổng kết</h1>
          <p className="text-sm text-muted-foreground">Chỉ bao gồm các đơn hàng đã thanh toán</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={handlePrint} className="transition-transform duration-200 hover:-translate-y-0.5">
            <Printer className="mr-2 h-4 w-4" />
            In báo cáo
          </Button>

          <Select value={filterType} onValueChange={handleFilterChange} disabled={loading}>
            <SelectTrigger className="w-[180px] transition-shadow duration-200 focus:shadow-md">
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
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal transition-shadow duration-200 focus:shadow-md">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{rangeLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(value) => setDateRange(value ?? { from: undefined, to: undefined })}
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
        <h1 className="text-2xl font-bold uppercase">Báo cáo tổng kết doanh thu (Đã thanh toán)</h1>
        <p className="mt-2 text-sm">
          Từ ngày: {format(dateRange.from, "dd/MM/yyyy")} - Đến ngày: {format(dateRange.to, "dd/MM/yyyy")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`report-card rounded-2xl border bg-gradient-to-br ${metric.tone} p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{metric.label}</p>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="report-card relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 print:border-none print:shadow-none">
        {isRefreshing && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-card/70 dark:bg-slate-900/70 py-3 backdrop-blur-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Đang cập nhật dữ liệu</span>
          </div>
        )}
        <div className={`overflow-x-auto transition-opacity duration-300 ${isRefreshing ? "opacity-70" : "opacity-100"}`}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b font-medium text-foreground">
                <th className="px-4 py-3 text-left">Mã chứng từ</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Nhân viên</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">T.Toán</th>
                <th className="px-4 py-3 text-right">SL</th>
                <th className="px-4 py-3 text-right">Tổng tiền hàng</th>
                <th className="px-4 py-3 text-right">Phí ship</th>
                <th className="px-4 py-3 text-right">Doanh thu </th>
              </tr>
            </thead>
            <tbody>
              {/* Grouping row */}
              <tr className="bg-yellow-50 dark:bg-yellow-900/30 font-medium border-b cursor-pointer transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                onClick={() => {
                  const next = new Set(expandedRows);
                  if (next.has(0)) next.delete(0);
                  else next.add(0);
                  setExpandedRows(next);
                }}
                style={{ animationDelay: "40ms" }}>
                <td className="px-4 py-3 flex items-center gap-2">
                  {expandedRows.has(0) ? (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                  Hóa đơn: {data.length}
                </td>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-right">{totals.qty}</td>
                <td className="px-4 py-3 text-right">{formatMoney(totals.itemsPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-600">+{formatMoney(totals.delivery)}</td>
                <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(totals.revenue)}</td>
              </tr>

              {expandedRows.has(0) && data.map((order, index) => (
                <tr
                  key={order.orderId}
                  className="report-row border-b transition-colors hover:bg-muted dark:hover:bg-muted/50"
                  style={{ "--row-index": index }}
                >
                  <td className="px-4 py-3 font-medium text-foreground">#{order.orderId}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.staffName}</td>
                  <td className="px-4 py-3">{format(new Date(order.time), "HH:mm dd/MM")}</td>
                  <td className="px-4 py-3 capitalize">{order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'payos' ? 'Chuyển khoản bằng PayOS' : 'Khác'}</td>
                  <td className="px-4 py-3 text-right">{order.totalQuantity}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(order.totalItemsPrice)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">+{formatMoney(order.deliveryFee)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(order.revenue)}</td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground italic">
                    Không tìm thấy dữ liệu đã thanh toán trong khoảng thời gian này
                  </td>
                </tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot className="bg-muted dark:bg-muted/50 font-bold border-t-2">
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-foreground border-r">TỔNG CỘNG</td>
                  <td className="px-4 py-4 text-right border-r">{totals.qty}</td>
                  <td className="px-4 py-4 text-right border-r">{formatMoney(totals.itemsPrice)}</td>
                  <td className="px-4 py-4 text-right border-r text-blue-600">+{formatMoney(totals.delivery)}</td>
                  <td className="px-4 py-4 text-right text-green-700 text-lg">{formatMoney(totals.revenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:flex flex-col items-end gap-1 mt-8 border-t pt-4">
        <p className="font-bold">Người lập biểu</p>
        <p className="text-xs text-muted-foreground mt-12">(Ký và ghi rõ họ tên)</p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes reportFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .report-shell {
          animation: reportFadeUp 320ms ease-out;
        }

        .report-card {
          animation: reportFadeUp 420ms ease-out both;
        }

        .report-row {
          animation: reportFadeUp 280ms ease-out both;
          animation-delay: calc(var(--row-index) * 18ms);
        }

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
