import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Printer,
  Loader2,
  Minus,
  Plus,
  Box,
  LayoutDashboard,
  Clock,
  User,
  BarChart as BarChartIcon,
  FileText,
  Layers
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Calendar } from "../../../components/ui/calendar";
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

const EMPTY_TOTALS = { qty: 0, itemsPrice: 0, discount: 0, revenue: 0 };
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
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [shiftData, setShiftData] = useState(null); // aggregated { shifts[], cashMetrics }
  const [shiftLoading, setShiftLoading] = useState(false);
  const [expandedShiftRows, setExpandedShiftRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set([0])); // For Overview
  const [expandedTimeRows, setExpandedTimeRows] = useState(new Set()); // For Time report
  const [expandedStaffRows, setExpandedStaffRows] = useState(new Set()); // For Staff report
  const [staffViewType, setStaffViewType] = useState("chart"); // 'chart' or 'report'
  const isRefreshing = loading && (data.length > 0 || productData.length > 0 || timeData.length > 0 || staffData.length > 0);

  const fetchReportData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    try {
      setLoading(true);
      const start = format(startOfDay(dateRange.from), "yyyy-MM-dd HH:mm:ss");
      const end = format(endOfDay(dateRange.to), "yyyy-MM-dd HH:mm:ss");

      const [orderRes, productRes, timeRes, staffRes] = await Promise.all([
        adminDBService.getDetailedReport(start, end),
        adminDBService.getProductReport(start, end),
        adminDBService.getTimeReport(start, end),
        adminDBService.getStaffReport(start, end)
      ]);

      setData(parseReportRows(orderRes));
      setProductData(parseReportRows(productRes));
      setTimeData(parseReportRows(timeRes));
      setStaffData(parseReportRows(staffRes));
    } catch (error) {
      console.error("Error fetching report data:", error);
      setData([]);
      setProductData([]);
      setTimeData([]);
      setStaffData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const fetchShiftData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    try {
      setShiftLoading(true);
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      // Fetch one report per day in parallel
      const results = await Promise.all(
        days.map((d) => adminDBService.getShiftReport(format(d, "yyyy-MM-dd")).then((r) => r?.data ?? r).catch(() => null))
      );
      // Aggregate across days: group by templateId
      const byTemplate = {};
      let totalStoreCash = 0;
      let totalEmployeeCash = 0;
      results.forEach((res) => {
        if (!res) return;
        totalStoreCash += toNumber(res.cashMetrics?.storeCash);
        totalEmployeeCash += toNumber(res.cashMetrics?.employeeCash);
        (res.shifts || []).forEach((shift) => {
          const key = shift.templateId;
          if (!byTemplate[key]) {
            byTemplate[key] = { ...shift, totalOrders: 0, completedOrders: 0, revenue: 0, orders: [], cashSession: { openingCash: 0, closingCash: 0, cashDifference: 0, sessionCount: 0, openSessions: 0 } };
          }
          byTemplate[key].totalOrders += toNumber(shift.totalOrders);
          byTemplate[key].completedOrders += toNumber(shift.completedOrders);
          byTemplate[key].revenue += toNumber(shift.revenue);
          byTemplate[key].orders = [...byTemplate[key].orders, ...(shift.orders || [])];
          byTemplate[key].cashSession.openingCash += toNumber(shift.cashSession?.openingCash);
          byTemplate[key].cashSession.closingCash += toNumber(shift.cashSession?.closingCash);
          byTemplate[key].cashSession.cashDifference += toNumber(shift.cashSession?.cashDifference);
          byTemplate[key].cashSession.sessionCount += toNumber(shift.cashSession?.sessionCount);
          byTemplate[key].cashSession.openSessions += toNumber(shift.cashSession?.openSessions);
        });
      });
      setShiftData({
        shifts: Object.values(byTemplate),
        cashMetrics: { storeCash: totalStoreCash, employeeCash: totalEmployeeCash },
      });
    } catch (err) {
      console.error("Error fetching shift report:", err);
      setShiftData(null);
    } finally {
      setShiftLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === "shifts") {
      fetchShiftData();
    }
  }, [activeTab, fetchShiftData]);

  // Re-fetch shift data when dateRange changes while on shift tab
  useEffect(() => {
    if (activeTab === "shifts") {
      fetchShiftData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const toggleShiftRow = (templateId) => {
    const next = new Set(expandedShiftRows);
    if (next.has(templateId)) next.delete(templateId);
    else next.add(templateId);
    setExpandedShiftRows(next);
  };

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
          revenue: acc.revenue + (toNumber(curr.totalItemsPrice) - toNumber(curr.discount)),
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

  const productTotals = useMemo(() => {
    return productData.reduce((acc, curr) => ({
      qtySold: acc.qtySold + toNumber(curr.quantitySold),
      revenue: acc.revenue + toNumber(curr.revenue),
      netRevenue: acc.netRevenue + toNumber(curr.netRevenue),
    }), { qtySold: 0, revenue: 0, netRevenue: 0 });
  }, [productData]);

  const timeTotals = useMemo(() => {
    return timeData.reduce((acc, curr) => ({
      orderCount: acc.orderCount + toNumber(curr.orderCount),
      itemsPrice: acc.itemsPrice + toNumber(curr.totalItemsPrice),
      discount: acc.discount + toNumber(curr.discount),
      revenue: acc.revenue + toNumber(curr.revenue),
      netRevenue: acc.netRevenue + toNumber(curr.netRevenue),
    }), { orderCount: 0, itemsPrice: 0, discount: 0, revenue: 0, netRevenue: 0 });
  }, [timeData]);

  const staffTotals = useMemo(() => {
    return staffData.reduce((acc, curr) => ({
      orderCount: acc.orderCount + toNumber(curr.orderCount),
      itemsPrice: acc.itemsPrice + toNumber(curr.totalItemsPrice),
      discount: acc.discount + toNumber(curr.discount),
      revenue: acc.revenue + toNumber(curr.revenue),
      netRevenue: acc.netRevenue + toNumber(curr.netRevenue),
    }), { orderCount: 0, itemsPrice: 0, discount: 0, revenue: 0, netRevenue: 0 });
  }, [staffData]);

  const handlePrint = () => {
    window.print();
  };

  const toggleTimeRow = (hour) => {
    const next = new Set(expandedTimeRows);
    if (next.has(hour)) next.delete(hour);
    else next.add(hour);
    setExpandedTimeRows(next);
  };

  const toggleStaffRow = (staffId) => {
    const next = new Set(expandedStaffRows);
    if (next.has(staffId)) next.delete(staffId);
    else next.add(staffId);
    setExpandedStaffRows(next);
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
        <h1 className="text-2xl font-bold uppercase">
          {activeTab === "overview" ? "Báo cáo tổng kết doanh thu" : activeTab === "products" ? "Báo cáo doanh thu theo hàng hóa" : activeTab === "time" ? "Báo cáo doanh thu theo thời gian" : "Báo cáo bán hàng theo nhân viên"}
        </h1>
        <p className="mt-2 text-sm">
          Từ ngày: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : ""} - Đến ngày: {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : ""}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-muted p-1 h-12 rounded-2xl w-fit">
          <TabsTrigger value="overview" className="px-6 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="products" className="px-6 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Box className="mr-2 h-4 w-4" />
            Hàng hóa
          </TabsTrigger>
          <TabsTrigger value="time" className="px-6 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Thời gian
          </TabsTrigger>
          <TabsTrigger value="staff" className="px-6 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="mr-2 h-4 w-4" />
            Nhân viên
          </TabsTrigger>
          <TabsTrigger value="shifts" className="px-6 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Layers className="mr-2 h-4 w-4" />
            Ca làm việc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                  <tr className="border-b font-medium text-foreground bg-muted/50">
                    <th className="px-4 py-3 text-left">Mã chứng từ</th>
                    <th className="px-4 py-3 text-left">Khách hàng</th>
                    <th className="px-4 py-3 text-left">Nhân viên</th>
                    <th className="px-4 py-3 text-left">Thời gian</th>
                    <th className="px-4 py-3 text-left">T.Toán</th>
                    <th className="px-4 py-3 text-right">SL</th>
                    <th className="px-4 py-3 text-right">Tổng tiền hàng</th>
                    <th className="px-4 py-3 text-right">Giảm giá</th>
                    <th className="px-4 py-3 text-right">Doanh thu </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-yellow-50/50 dark:bg-yellow-900/10 font-medium border-b cursor-pointer transition-colors hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
                    onClick={() => {
                      const next = new Set(expandedRows);
                      if (next.has(0)) next.delete(0);
                      else next.add(0);
                      setExpandedRows(next);
                    }}>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {expandedRows.has(0) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      Hóa đơn: {data.length}
                    </td>
                    <td colSpan={4}></td>
                    <td className="px-4 py-3 text-right">{totals.qty}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(totals.itemsPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">-{formatMoney(totals.discount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(totals.revenue)}</td>
                  </tr>

                  {expandedRows.has(0) && data.map((order) => (
                    <tr key={order.orderId} className="report-row border-b transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">#{order.orderId}</td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3">{order.staffName}</td>
                      <td className="px-4 py-3">{order.time ? format(new Date(order.time), "HH:mm dd/MM") : ""}</td>
                      <td className="px-4 py-3 capitalize">{order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'payos' ? 'Chuyển khoản' : 'Khác'}</td>
                      <td className="px-4 py-3 text-right">{order.totalQuantity}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(order.totalItemsPrice)}</td>
                      <td className="px-4 py-3 text-right text-red-600">-{formatMoney(order.discount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(toNumber(order.totalItemsPrice) - toNumber(order.discount))}</td>
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
                      <td className="px-4 py-4 text-right border-r text-red-600">-{formatMoney(totals.discount)}</td>
                      <td className="px-4 py-4 text-right text-green-700 text-lg">{formatMoney(totals.revenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
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
                  <tr className="border-b font-medium text-foreground bg-muted/50">
                    <th className="px-4 py-3 text-left">Mã hàng</th>
                    <th className="px-4 py-3 text-left">Tên hàng</th>
                    <th className="px-4 py-3 text-right">SL bán</th>
                    <th className="px-4 py-3 text-right">Giá niêm yết</th>
                    <th className="px-4 py-3 text-right">Doanh thu thuần</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-sky-50/50 dark:bg-sky-900/10 font-medium border-b">
                    <td className="px-4 py-3" colSpan={2}>
                      SL mặt hàng: {productData.length}
                    </td>
                    <td className="px-4 py-3 text-right">{productTotals.qtySold}</td>
                    <td className="px-4 py-3 text-right"></td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(productTotals.netRevenue)}</td>
                  </tr>

                  {productData.map((prod) => (
                    <tr key={`${prod.productCode}-${prod.size}`} className="report-row border-b transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-sky-700 dark:text-sky-400 capitalize">{prod.productCode}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{prod.productName}</div>
                        {prod.size && <Badge variant="outline" className="mt-1 text-[10px] h-4">{prod.size}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">{prod.quantitySold}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(prod.listPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(prod.netRevenue)}</td>
                    </tr>
                  ))}

                  {productData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                        Không tìm thấy dữ liệu hàng hóa trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <div className="report-card relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 print:border-none print:shadow-none">
            {isRefreshing && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-card/70 dark:bg-slate-900/70 py-3 backdrop-blur-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Đang cập nhật dữ liệu</span>
              </div>
            )}
            <div className={`overflow-x-auto transition-opacity duration-300 ${isRefreshing ? "opacity-70" : "opacity-100"}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b font-medium text-foreground bg-sky-100/50">
                    <th className="px-4 py-3 text-left">Thời gian</th>
                    <th className="px-4 py-3 text-right">SL đơn bán</th>
                    <th className="px-4 py-3 text-right">Tổng tiền hàng</th>
                    <th className="px-4 py-3 text-right">Giảm giá HĐ</th>
                    <th className="px-4 py-3 text-right">Doanh thu thuần</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-yellow-50/80 font-medium border-b">
                    <td className="px-4 py-3" colSpan={1}></td>
                    <td className="px-4 py-3 text-right">{timeTotals.orderCount}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(timeTotals.itemsPrice)}</td>
                    <td className="px-4 py-3 text-right text-red-600">-{formatMoney(timeTotals.discount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(timeTotals.netRevenue)}</td>
                  </tr>

                  {timeData.map((hourSlot) => (
                    <Fragment key={hourSlot.timeHour}>
                      <tr
                        className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleTimeRow(hourSlot.timeHour)}
                      >
                        <td className="px-4 py-3 flex items-center gap-2 font-medium">
                          {expandedTimeRows.has(hourSlot.timeHour) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          {hourSlot.timeHour}
                        </td>
                        <td className="px-4 py-3 text-right">{hourSlot.orderCount}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(hourSlot.totalItemsPrice)}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(hourSlot.discount)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(hourSlot.netRevenue)}</td>
                      </tr>
                      {expandedTimeRows.has(hourSlot.timeHour) && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <div className="p-4 bg-muted/20">
                              <table className="w-full text-xs rounded-lg overflow-hidden border bg-background">
                                <thead>
                                  <tr className="bg-emerald-100/50 text-emerald-800 font-semibold border-b">
                                    <th className="px-4 py-2 text-left">Mã giao dịch</th>
                                    <th className="px-4 py-2 text-left">Thời gian</th>
                                    <th className="px-4 py-2 text-left">Nhân viên</th>
                                    <th className="px-4 py-2 text-left">Khách hàng</th>
                                    <th className="px-4 py-2 text-right">Tổng tiền hàng</th>
                                    <th className="px-4 py-2 text-right">Giảm giá</th>
                                    <th className="px-4 py-2 text-right">Doanh thu thuần</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {hourSlot.orders?.map((ord) => (
                                    <tr key={ord.orderId} className="border-b hover:bg-muted/10">
                                      <td className="px-4 py-2 font-medium">#{ord.orderId}</td>
                                      <td className="px-4 py-2">{ord.time ? format(new Date(ord.time), "dd/MM/yyyy HH:mm") : ""}</td>
                                      <td className="px-4 py-2">{ord.staffName}</td>
                                      <td className="px-4 py-2">{ord.customerName}</td>
                                      <td className="px-4 py-2 text-right">{formatMoney(ord.totalItemsPrice)}</td>
                                      <td className="px-4 py-2 text-right text-red-500">-{formatMoney(ord.discount)}</td>
                                      <td className="px-4 py-2 text-right font-bold text-green-600">{formatMoney(ord.netRevenue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}

                  {timeData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                        Không tìm thấy dữ liệu trong khoảng thời gian này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Settings - Hidden on print */}
            <div className="w-full lg:w-64 space-y-6 print:hidden">
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-6 sticky top-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-sky-500" />
                    Kiểu hiển thị
                  </h3>
                  <div className="grid gap-2">
                    <button
                      onClick={() => setStaffViewType("chart")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        staffViewType === "chart"
                          ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <BarChartIcon className="h-4 w-4" />
                      Biểu đồ
                    </button>
                    <button
                      onClick={() => setStaffViewType("report")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        staffViewType === "report"
                          ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Báo cáo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {staffViewType === "chart" && !loading ? (
                <div className="report-card rounded-2xl border bg-card p-6 shadow-sm min-h-[500px]">
                  <h3 className="text-lg font-bold mb-8 text-foreground">Top 10 người bán nhiều nhất (đã trừ trả hàng)</h3>
                  <div className="h-[450px] w-full">
                    {staffData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={staffData.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          barCategoryGap="30%"
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="staffName" 
                            type="category" 
                            tick={{ fontSize: 12, fontWeight: 500, fill: "currentColor" }}
                            width={120}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0, 0, 0, 0.04)', radius: 4 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background border p-3 rounded-xl shadow-xl border-border">
                                    <p className="font-bold text-sm mb-1">{payload[0].payload.staffName}</p>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Doanh thu:</span>
                                        <span className="font-bold text-green-600">{formatMoney(payload[0].value)}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Số đơn hàng:</span>
                                        <span className="font-bold text-sky-600">{payload[0].payload.orderCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={28}>
                            {staffData.slice(0, 10).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? "#0369a1" : index === 1 ? "#0ea5e9" : "#38bdf8"} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic">
                        Không có dữ liệu để hiển thị biểu đồ
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="report-card relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 print:border-none print:shadow-none">
                  {isRefreshing && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-card/70 dark:bg-slate-900/70 py-3 backdrop-blur-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Đang cập nhật dữ liệu</span>
                    </div>
                  )}
                  <div className={`overflow-x-auto transition-opacity duration-300 ${isRefreshing ? "opacity-70" : "opacity-100"}`}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b font-medium text-foreground bg-emerald-50/50 dark:bg-emerald-900/10">
                          <th className="px-4 py-3 text-left">Nhân viên</th>
                          <th className="px-4 py-3 text-right">SL đơn bán</th>
                          <th className="px-4 py-3 text-right">Tổng tiền hàng</th>
                          <th className="px-4 py-3 text-right">Giảm giá HĐ</th>
                          <th className="px-4 py-3 text-right">Doanh thu thuần</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-yellow-50/80 dark:bg-yellow-900/10 font-bold border-b">
                          <td className="px-4 py-3">TỔNG CỘNG</td>
                          <td className="px-4 py-3 text-right">{staffTotals.orderCount}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(staffTotals.itemsPrice)}</td>
                          <td className="px-4 py-3 text-right text-red-600">-{formatMoney(staffTotals.discount)}</td>
                          <td className="px-4 py-3 text-right text-green-700">{formatMoney(staffTotals.netRevenue)}</td>
                        </tr>

                        {staffData.map((staff) => (
                          <Fragment key={staff.staffId || 'unassigned'}>
                            <tr
                              className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() => toggleStaffRow(staff.staffId)}
                            >
                              <td className="px-4 py-3 flex items-center gap-2 font-medium">
                                {expandedStaffRows.has(staff.staffId) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {staff.staffName || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right">{staff.orderCount}</td>
                              <td className="px-4 py-3 text-right">{formatMoney(staff.totalItemsPrice)}</td>
                              <td className="px-4 py-3 text-right text-red-500">-{formatMoney(staff.discount)}</td>
                              <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(staff.netRevenue)}</td>
                            </tr>
                            {expandedStaffRows.has(staff.staffId) && (
                              <tr>
                                <td colSpan={5} className="p-0">
                                  <div className="p-4 bg-muted/20">
                                    <table className="w-full text-xs rounded-lg overflow-hidden border bg-background">
                                      <thead>
                                        <tr className="bg-sky-100/50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-200 font-semibold border-b">
                                          <th className="px-4 py-2 text-left">Mã giao dịch</th>
                                          <th className="px-4 py-2 text-left">Thời gian</th>
                                          <th className="px-4 py-2 text-left">Khách hàng</th>
                                          <th className="px-4 py-2 text-right">Tổng tiền hàng</th>
                                          <th className="px-4 py-2 text-right">Giảm giá</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {staff.orders?.map((ord) => (
                                          <tr key={ord.orderId} className="border-b hover:bg-muted/10">
                                            <td className="px-4 py-2 font-medium">#{ord.orderId}</td>
                                            <td className="px-4 py-2">{ord.time ? format(new Date(ord.time), "dd/MM/yyyy HH:mm") : ""}</td>
                                            <td className="px-4 py-2">{ord.customerName}</td>
                                            <td className="px-4 py-2 text-right">{formatMoney(ord.totalItemsPrice)}</td>
                                            <td className="px-4 py-2 text-right text-red-500">-{formatMoney(ord.discount)}</td>
                                            <td className="px-4 py-2 text-right font-bold text-green-600">{formatMoney(ord.revenue)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}

                        {staffData.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                              Không tìm thấy dữ liệu trong khoảng thời gian này
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════ SHIFT TAB ═══════════════════ */}
        <TabsContent value="shifts" className="space-y-6">
          {/* Info banner — reuses the shared date range */}

          {shiftLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải dữ liệu ca...
            </div>
          )}

          {!shiftLoading && shiftData && (
            <>
              {/* Summary cards per shift */}
              {shiftData.shifts?.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {shiftData.shifts.map((shift) => (
                    <div
                      key={shift.templateId}
                      className="report-card rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      style={{ borderLeft: `4px solid ${shift.color || '#64748b'}` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{shift.name}</p>
                          <p className="text-xs text-muted-foreground">{shift.startTime} – {shift.endTime}</p>
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: (shift.color || '#64748b') + '22', color: shift.color || '#64748b' }}>
                          {shift.completedOrders}/{shift.totalOrders} đơn
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Doanh thu</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatMoney(shift.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiền mặt đầu ca</p>
                          <p className="text-base font-semibold">{formatMoney(shift.cashSession?.openingCash)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tiền mặt cuối ca</p>
                          <p className="text-base font-semibold">{formatMoney(shift.cashSession?.closingCash)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Chênh lệch</p>
                          <p className={`text-base font-semibold ${shift.cashSession?.cashDifference < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {shift.cashSession?.cashDifference >= 0 ? '+' : ''}{formatMoney(shift.cashSession?.cashDifference)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cash metrics summary */}
              {shiftData.cashMetrics && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="report-card rounded-2xl border bg-gradient-to-br from-sky-500/10 to-cyan-500/5 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Tiền mặt tại quầy</p>
                    <p className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-300">{formatMoney(shiftData.cashMetrics.storeCash)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tiền nhận được từ các đơn đã thanh toán bằng tiền mặt</p>
                  </div>
                  <div className="report-card rounded-2xl border bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Tiền nhân viên giữ</p>
                    <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{formatMoney(shiftData.cashMetrics.employeeCash)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tiền mặt từ đơn chưa quyết toán</p>
                  </div>
                </div>
              )}

              {/* Per-shift collapsible order table */}
              <div className="report-card overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="px-5 py-4 border-b bg-muted/30">
                  <h3 className="text-sm font-semibold text-foreground">Chi tiết đơn hàng theo ca — {rangeLabel}</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b font-medium text-foreground bg-muted/50">
                      <th className="px-4 py-3 text-left">Ca / Khung giờ</th>
                      <th className="px-4 py-3 text-right">Tổng đơn</th>
                      <th className="px-4 py-3 text-right">Hoàn thành</th>
                      <th className="px-4 py-3 text-right">Doanh thu</th>
                      <th className="px-4 py-3 text-right">Tiền mặt đầu ca</th>
                      <th className="px-4 py-3 text-right">Tiền mặt cuối ca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftData.shifts?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                          Không có dữ liệu ca làm việc cho ngày này
                        </td>
                      </tr>
                    )}
                    {shiftData.shifts?.map((shift) => (
                      <Fragment key={shift.templateId}>
                        <tr
                          className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => toggleShiftRow(shift.templateId)}
                          style={{ borderLeft: `3px solid ${shift.color || '#64748b'}` }}
                        >
                          <td className="px-4 py-3 flex items-center gap-2 font-medium">
                            {expandedShiftRows.has(shift.templateId) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            <span>{shift.name}</span>
                            <span className="text-xs text-muted-foreground font-normal">({shift.startTime}–{shift.endTime})</span>
                          </td>
                          <td className="px-4 py-3 text-right">{shift.totalOrders}</td>
                          <td className="px-4 py-3 text-right text-emerald-700 font-medium">{shift.completedOrders}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">{formatMoney(shift.revenue)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(shift.cashSession?.openingCash)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(shift.cashSession?.closingCash)}</td>
                        </tr>
                        {expandedShiftRows.has(shift.templateId) && (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <div className="p-4 bg-muted/20">
                                {shift.orders?.length === 0 ? (
                                  <p className="text-center text-xs text-muted-foreground italic py-4">Không có đơn hàng trong ca này</p>
                                ) : (
                                  <table className="w-full text-xs rounded-lg overflow-hidden border bg-background">
                                    <thead>
                                      <tr className="font-semibold border-b" style={{ background: (shift.color || '#64748b') + '18', color: shift.color || '#64748b' }}>
                                        <th className="px-4 py-2 text-left">Mã giao dịch</th>
                                        <th className="px-4 py-2 text-left">Thời gian</th>
                                        <th className="px-4 py-2 text-left">Nhân viên</th>
                                        <th className="px-4 py-2 text-left">Khách hàng</th>
                                        <th className="px-4 py-2 text-left">TT</th>
                                        <th className="px-4 py-2 text-right">SL</th>
                                        <th className="px-4 py-2 text-right">Doanh thu</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {shift.orders.map((ord) => (
                                        <tr key={ord.orderId} className="border-b hover:bg-muted/10">
                                          <td className="px-4 py-2 font-medium">#{ord.orderId}</td>
                                          <td className="px-4 py-2">{ord.time ? format(new Date(ord.time), "HH:mm") : ""}</td>
                                          <td className="px-4 py-2">{ord.staffName}</td>
                                          <td className="px-4 py-2">{ord.customerName}</td>
                                          <td className="px-4 py-2">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                              ord.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                              {ord.isPaid ? 'Đã TT' : 'Chưa TT'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-right">{ord.totalQuantity}</td>
                                          <td className="px-4 py-2 text-right font-bold text-green-600">{formatMoney(ord.revenue)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!shiftLoading && !shiftData && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Layers className="h-10 w-10 opacity-30" />
              <p className="italic text-sm">Chọn khoảng ngày bêng bộ lọc phía trên và nhấn "Làm mới" để tải dữ liệu ca</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
