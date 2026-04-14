import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  TrendingUp,
  ShoppingCart,
  BarChart2,
  Banknote,
  UserCheck,
  ArrowUpDown,
  LockOpen,
  Lock,
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

// ─── Helpers ────────────────────────────────────────────────────────────────
const moneyFmt = new Intl.NumberFormat("vi-VN");
const toNum = (v) => Number(v) || 0;
const fmt = (v) => moneyFmt.format(toNum(v));

// Colour mapping – mirrors ShiftTemplatePage COLOR_OPTIONS
const COLOR_MAP = {
  red:     { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500",     activeBg: "bg-red-600"     },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500",  activeBg: "bg-orange-600"  },
  yellow:  { bg: "bg-yellow-100",  text: "text-yellow-700",  dot: "bg-yellow-500",  activeBg: "bg-yellow-500"  },
  green:   { bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500",   activeBg: "bg-green-600"   },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", activeBg: "bg-emerald-600" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500",    activeBg: "bg-teal-600"    },
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    activeBg: "bg-blue-600"    },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500",  activeBg: "bg-indigo-600"  },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500",  activeBg: "bg-purple-600"  },
};
const getColor = (c) => COLOR_MAP[c] ?? COLOR_MAP.blue;

const formatTime = (t) => (t ? t.slice(0, 5) : "");

// ─── Component ───────────────────────────────────────────────────────────────
const AdminShiftReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState("today");
  const [activeShift, setActiveShift] = useState(null); // null = "Tất Cả Ca"
  const [reportData, setReportData] = useState(null);   // { date, shifts, cashMetrics }
  const [loading, setLoading] = useState(true);

  const isRefreshing = loading && reportData !== null;

  // ─── Fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await adminDBService.getShiftReport(dateStr);
      // support both { data } and bare payload shapes
      const payload = res?.data ?? res;
      setReportData(payload || null);
    } catch (err) {
      console.error("Error fetching shift report:", err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset active shift when data reloads
  useEffect(() => {
    setActiveShift(null);
  }, [selectedDate]);

  // ─── Filter ─────────────────────────────────────────────────────────────
  const handleFilterChange = (value) => {
    setFilterType(value);
    const today = new Date();
    switch (value) {
      case "today":
        setSelectedDate(today);
        break;
      case "yesterday":
        setSelectedDate(subDays(today, 1));
        break;
      default:
        break;
    }
  };

  // ─── Derived data ────────────────────────────────────────────────────────
  const shifts = reportData?.shifts ?? [];
  const cashMetrics = reportData?.cashMetrics ?? { storeCash: 0, employeeCash: 0 };

  // Aggregate for "Tất Cả Ca"
  const allShiftAgg = useMemo(
    () => ({
      totalOrders:     shifts.reduce((s, sh) => s + sh.totalOrders, 0),
      completedOrders: shifts.reduce((s, sh) => s + sh.completedOrders, 0),
      revenue:         shifts.reduce((s, sh) => s + sh.revenue, 0),
    }),
    [shifts]
  );

  // Active shift stats (null = all)
  const activeStats = useMemo(() => {
    if (activeShift === null) return allShiftAgg;
    return shifts.find((s) => s.templateId === activeShift) ?? {
      totalOrders: 0, completedOrders: 0, revenue: 0,
    };
  }, [activeShift, allShiftAgg, shifts]);

  const avgOrder = activeStats.completedOrders > 0
    ? activeStats.revenue / activeStats.completedOrders
    : 0;

  const activeShiftLabel = useMemo(() => {
    if (activeShift === null) return "Tất Cả Ca";
    const s = shifts.find((sh) => sh.templateId === activeShift);
    return s ? s.name : "Tất Cả Ca";
  }, [activeShift, shifts]);

  // Orders to display in the order list section
  const activeOrders = useMemo(() => {
    if (activeShift === null) {
      // Merge all shifts' orders, sorted by time desc
      return shifts
        .flatMap((sh) => sh.orders ?? [])
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    }
    const sh = shifts.find((s) => s.templateId === activeShift);
    return sh?.orders ?? [];
  }, [activeShift, shifts]);

  const paymentLabel = (method) => {
    if (method === "cash")  return "Tiền mặt";
    if (method === "payos") return "Chuyển khoản";
    return method ?? "N/A";
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────
  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm h-20" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 rounded-2xl border bg-card p-4 shadow-sm h-28" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm h-24" />)}
          </div>
          <div className="rounded-2xl border bg-card shadow-sm h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="shift-report-shell space-y-6 p-6 min-h-screen bg-background text-foreground">

      {/* ── Header ── */}
      <div className="shift-card flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm flex-wrap">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-200">
            Báo cáo theo ca
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Báo Cáo Theo Ca</h1>
          <p className="text-sm text-muted-foreground">
            Thống kê đơn hàng &amp; tiền mặt theo ca làm việc
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick-filter select */}
          <Select value={filterType} onValueChange={handleFilterChange} disabled={loading}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chọn ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="yesterday">Hôm qua</SelectItem>
              <SelectItem value="custom">Tùy chọn</SelectItem>
            </SelectContent>
          </Select>

          {/* Date picker shown for custom */}
          {filterType === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Date badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
          </span>
        </div>
      </div>

      {/* ── Shift Selector Cards ── */}
      <div className="shift-card grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* "Tất Cả Ca" card */}
        <button
          onClick={() => setActiveShift(null)}
          className={`relative rounded-2xl border p-4 shadow-sm text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none
            ${activeShift === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`h-5 w-5 ${activeShift === null ? "text-primary-foreground" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">Tất Cả Ca</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${activeShift === null ? "text-primary-foreground" : "text-primary"}`}>
            {fmt(allShiftAgg.revenue)} đ
          </p>
        </button>

        {/* Dynamic shift template cards */}
        {shifts.map((shift) => {
          const isActive = activeShift === shift.templateId;
          const col = getColor(shift.color);
          return (
            <button
              key={shift.templateId}
              onClick={() => setActiveShift(shift.templateId)}
              className={`relative rounded-2xl border p-4 shadow-sm text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none
                ${isActive
                  ? `${col.activeBg} text-white border-transparent`
                  : `bg-card text-foreground border-border hover:border-current`
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-white/70" : col.dot}`} />
                <span className="text-xs font-medium uppercase tracking-wider opacity-80 truncate">
                  {shift.name}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
                {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
              </p>
              <p className={`text-lg font-bold mt-2 ${isActive ? "text-white" : col.text}`}>
                {fmt(shift.revenue)} đ
              </p>
            </button>
          );
        })}

        {shifts.length === 0 && !loading && (
          <div className="col-span-full text-sm text-muted-foreground italic px-2">
            Chưa có ca làm việc nào được cấu hình.
          </div>
        )}
      </div>

      {/* ── Summary Metric Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {/* Tổng Doanh Thu */}
        <div className="shift-card rounded-2xl border bg-gradient-to-br from-sky-500/15 to-cyan-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tổng Doanh Thu</p>
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-sky-600 dark:text-sky-400">
            {fmt(activeStats.revenue)} đ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{activeShiftLabel}</p>
        </div>

        {/* Tổng Đơn Hàng */}
        <div className="shift-card rounded-2xl border bg-gradient-to-br from-violet-500/15 to-purple-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tổng Đơn Hàng</p>
            <ShoppingCart className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-violet-600 dark:text-violet-400">
            {activeStats.totalOrders}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hoàn thành: {activeStats.completedOrders}
          </p>
        </div>

        {/* Trung Bình / Đơn */}
        <div className="shift-card rounded-2xl border bg-gradient-to-br from-emerald-500/15 to-teal-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Trung Bình/Đơn</p>
            <BarChart2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {fmt(avgOrder)} đ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Giá trị trung bình</p>
        </div>
      </div>

      {/* ── Cash Metrics ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Tiền mặt tại quỹ */}
        <div className="shift-card rounded-2xl border bg-gradient-to-br from-amber-500/15 to-orange-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tiền Mặt Tại Quỹ</p>
                <p className="text-xs text-muted-foreground">Đã thu về hệ thống</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              Đã thanh toán
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {fmt(cashMetrics.storeCash)} đ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tổng tiền mặt đơn hàng đã hoàn thành trong ngày
          </p>
        </div>

        {/* Tiền mặt nhân viên đang giữ */}
        <div className="shift-card rounded-2xl border bg-gradient-to-br from-rose-500/15 to-pink-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40">
                <UserCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Nhân Viên Đang Giữ</p>
                <p className="text-xs text-muted-foreground">Chưa nộp về quỹ</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
              Chưa quyết toán
            </span>
          </div>
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
            {fmt(cashMetrics.employeeCash)} đ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Đơn tiền mặt chưa được thanh toán trong ngày
          </p>
        </div>
      </div>

      {/* ── Shift Cash Session Breakdown ── */}
      {shifts.length > 0 && (
        <div className="shift-card rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Chênh Lệch Tiền Ca Làm Việc</h2>
            <span className="ml-auto text-xs text-muted-foreground">Mở ca → Chốt ca</span>
          </div>

          <div className="divide-y">
            {shifts.map((shift) => {
              const col = getColor(shift.color);
              const cs = shift.cashSession ?? {
                openingCash: 0, closingCash: 0, cashDifference: 0, sessionCount: 0, openSessions: 0,
              };
              const isActive = activeShift === shift.templateId;
              const diff = cs.cashDifference;
              const diffPositive = diff > 0;
              const diffNegative = diff < 0;
              const hasSessions = cs.sessionCount > 0;
              return (
                <div
                  key={shift.templateId}
                  className={`px-5 py-4 flex flex-wrap items-center gap-4 transition-colors cursor-pointer ${
                    isActive ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/40"
                  }`}
                  onClick={() => setActiveShift(isActive ? null : shift.templateId)}
                >
                  {/* Shift label */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot}`} />
                    <div>
                      <p className={`text-sm font-semibold ${col.text}`}>{shift.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </p>
                    </div>
                  </div>

                  {hasSessions ? (
                    <>
                      {/* Opening cash */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[110px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <LockOpen className="h-3.5 w-3.5" />
                          <span className="text-xs uppercase tracking-wide">Mở ca</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{fmt(cs.openingCash)} đ</p>
                      </div>

                      <span className="text-muted-foreground text-lg font-light select-none">→</span>

                      {/* Closing cash */}
                      <div className="flex flex-col items-center gap-0.5 min-w-[110px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" />
                          <span className="text-xs uppercase tracking-wide">
                            {cs.openSessions > 0 ? "Đang mở" : "Chốt ca"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {cs.openSessions > 0
                            ? <span className="text-amber-500 italic">Chưa chốt</span>
                            : `${fmt(cs.closingCash)} đ`
                          }
                        </p>
                      </div>

                      {/* Difference */}
                      <div className="ml-auto flex flex-col items-end gap-0.5 min-w-[120px]">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Chênh lệch</span>
                        {cs.openSessions > 0 ? (
                          <p className="text-sm font-medium text-amber-500 italic">Chưa quyết toán</p>
                        ) : (
                          <p className={`text-lg font-bold ${
                            diffPositive ? "text-emerald-600 dark:text-emerald-400"
                            : diffNegative ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                          }`}>
                            {diffPositive ? "+" : ""}{fmt(diff)} đ
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="ml-4 text-sm text-muted-foreground italic">
                      Không có phiên thu ngân nào trong ca này
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detail Table ── */}
      <div className="shift-card relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300">
        {isRefreshing && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-card/70 py-3 backdrop-blur-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Đang cập nhật dữ liệu</span>
          </div>
        )}

        <div className={`overflow-x-auto transition-opacity duration-300 ${isRefreshing ? "opacity-70" : "opacity-100"}`}>
          <div className="px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-foreground">Thống Kê Chi Tiết Theo Ca</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b font-medium text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 text-left">Ca Làm Việc</th>
                <th className="px-5 py-3 text-left">Thời Gian</th>
                <th className="px-5 py-3 text-right">Tổng Đơn</th>
                <th className="px-5 py-3 text-right">Hoàn Thành</th>
                <th className="px-5 py-3 text-right">Doanh Thu</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground italic">
                    Chưa có ca làm việc nào. Hãy vào <strong>Lịch làm việc → Quản lý ca làm</strong> để thêm ca.
                  </td>
                </tr>
              ) : (
                shifts.map((shift, idx) => {
                  const col = getColor(shift.color);
                  const isRowActive = activeShift === shift.templateId;
                  return (
                    <tr
                      key={shift.templateId}
                      className={`shift-row border-b cursor-pointer transition-colors
                        ${isRowActive
                          ? "bg-primary/5 dark:bg-primary/10"
                          : "hover:bg-muted/50 dark:hover:bg-muted/30"
                        }`}
                      style={{ "--row-idx": idx }}
                      onClick={() => setActiveShift(isRowActive ? null : shift.templateId)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot}`} />
                          <span className={`font-medium ${col.text}`}>{shift.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </td>
                      <td className="px-5 py-3.5 text-right">{shift.totalOrders}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {shift.completedOrders}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-primary">
                        {fmt(shift.revenue)} đ
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {shifts.length > 0 && (
              <tfoot className="bg-muted/50 font-bold border-t-2">
                <tr>
                  <td colSpan={2} className="px-5 py-4 text-foreground">TỔNG CỘNG</td>
                  <td className="px-5 py-4 text-right">{allShiftAgg.totalOrders}</td>
                  <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400">
                    {allShiftAgg.completedOrders}
                  </td>
                  <td className="px-5 py-4 text-right text-primary text-lg">
                    {fmt(allShiftAgg.revenue)} đ
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Order List Section ── */}
      <div className="shift-card relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Danh Sách Đơn Hàng
            {activeShift !== null && (
              <span className="ml-2 text-muted-foreground font-normal">– {activeShiftLabel}</span>
            )}
          </h2>
          <span className="text-sm text-muted-foreground">{activeOrders.length} đơn</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b font-medium text-muted-foreground bg-muted/40">
                <th className="px-5 py-3 text-left">Mã đơn</th>
                <th className="px-5 py-3 text-left">Khách hàng</th>
                <th className="px-5 py-3 text-left">Nhân viên</th>
                <th className="px-5 py-3 text-left">Thời gian</th>
                <th className="px-5 py-3 text-left">T.Toán</th>
                <th className="px-5 py-3 text-right">SL</th>
                <th className="px-5 py-3 text-right">Tổng tiền hàng</th>
                <th className="px-5 py-3 text-right">Phí ship</th>
                <th className="px-5 py-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground italic">
                    Không có đơn hàng nào trong ca này
                  </td>
                </tr>
              ) : (
                activeOrders.map((order, idx) => (
                  <tr
                    key={`${order.orderId}-${idx}`}
                    className="order-row border-b transition-colors hover:bg-muted/50 dark:hover:bg-muted/30"
                    style={{ "--order-idx": idx }}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">#{order.orderId}</td>
                    <td className="px-5 py-3">{order.customerName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{order.staffName?.trim() || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {order.time ? format(new Date(order.time), "HH:mm dd/MM") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.paymentMethod === "cash"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : order.paymentMethod === "payos"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {paymentLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">{order.totalQuantity}</td>
                    <td className="px-5 py-3 text-right">{fmt(order.totalItemsPrice)} đ</td>
                    <td className="px-5 py-3 text-right text-blue-600 dark:text-blue-400">
                      {toNum(order.deliveryFee) > 0 ? `+${fmt(order.deliveryFee)} đ` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-primary">
                      {fmt(order.revenue)} đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shiftFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shift-report-shell { animation: shiftFadeUp 320ms ease-out; }
        .shift-card { animation: shiftFadeUp 420ms ease-out both; }
        .shift-row {
          animation: shiftFadeUp 260ms ease-out both;
          animation-delay: calc(var(--row-idx, 0) * 40ms);
        }
        .order-row {
          animation: shiftFadeUp 220ms ease-out both;
          animation-delay: calc(var(--order-idx, 0) * 20ms);
        }
      `}} />
    </div>
  );
};

export default AdminShiftReport;
