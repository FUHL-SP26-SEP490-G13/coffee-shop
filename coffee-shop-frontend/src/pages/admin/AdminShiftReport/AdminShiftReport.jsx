import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Printer,
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
import cashSessionService from "@/services/cashSessionService";
import userService from "@/services/userService";

const moneyFormatter = new Intl.NumberFormat("vi-VN");
const toNumber = (value) => Number(value) || 0;
const formatMoney = (value) => moneyFormatter.format(toNumber(value));

const formatRangeLabel = (range) => {
  if (!range?.from) return "Chọn ngày";
  if (!range?.to) return `${format(range.from, "dd/MM/yyyy")} - ...`;
  return `${format(range.from, "dd/MM/yyyy")} - ${format(
    range.to,
    "dd/MM/yyyy"
  )}`;
};

const parseReportRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.success && Array.isArray(payload.data)) return payload.data;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
};

const AdminShiftReport = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [filterType, setFilterType] = useState("7days");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for filter & pagination
  const [staffs, setStaffs] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  const isRefreshing = loading && data.length > 0;

  // Fetch staff list
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const res = await userService.getAllUsers();
        // Assuming either an array or { data: [] }
        let users = [];
        if (Array.isArray(res)) users = res;
        else if (res?.data && Array.isArray(res.data)) users = res.data;
        else if (res?.data?.data && Array.isArray(res.data.data))
          users = res.data.data;

        // Filter users who could open shifts (e.g. role admin/manager, staff, barista)
        // Usually roles: 1=manager, 2=staff, 3=barista
        users = users.filter((u) => [1, 2, 3].includes(Number(u.role_id)));
        setStaffs(users);
      } catch (error) {
        console.error("Error fetching staffs for filter:", error);
      }
    };
    fetchStaffs();
  }, []);

  const fetchReportData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    try {
      setLoading(true);
      const startDate = format(
        startOfDay(dateRange.from),
        "yyyy-MM-dd HH:mm:ss"
      );
      const endDate = format(endOfDay(dateRange.to), "yyyy-MM-dd HH:mm:ss");

      const res = await cashSessionService.getHistory({
        startDate,
        endDate,
        userId: selectedStaff === "all" ? undefined : selectedStaff,
        page: pagination.currentPage,
        limit: pagination.limit,
      });

      // Response: { success, data: { items: [...], pagination: {...} } }
      const responseData = res?.data || res;
      const items = Array.isArray(responseData?.items) ? responseData.items : parseReportRows(responseData);
      setData(items);

      if (responseData?.pagination) {
        setPagination((prev) => ({
          ...prev,
          currentPage: responseData.pagination.currentPage ?? prev.currentPage,
          totalPages: responseData.pagination.totalPages ?? prev.totalPages,
          total: responseData.pagination.total ?? prev.total,
          limit: responseData.pagination.limit ?? prev.limit,
        }));
      }
    } catch (error) {
      console.error("Error fetching shift report data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedStaff, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (value) => {
    setFilterType(value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
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

  const handleStaffChange = (val) => {
    setSelectedStaff(val);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const rangeLabel = useMemo(() => formatRangeLabel(dateRange), [dateRange]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, curr) => {
          let generatedCash = 0;
          let cashDiff = 0;
          if (curr.closed_at) {
            generatedCash =
              toNumber(curr.closing_cash_system) - toNumber(curr.opening_cash);
            cashDiff = toNumber(curr.cash_difference);
          }

          return {
            paidOrders: acc.paidOrders + toNumber(curr.paid_orders_count),
            openingCash: acc.openingCash + toNumber(curr.opening_cash),
            closingCashSystem:
              acc.closingCashSystem + toNumber(curr.closing_cash_system),
            generatedCash: acc.generatedCash + generatedCash,
            cashDifference: acc.cashDifference + cashDiff,
          };
        },
        {
          paidOrders: 0,
          openingCash: 0,
          closingCashSystem: 0,
          generatedCash: 0,
          cashDifference: 0,
        }
      ),
    [data]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Tổng Ca làm (trên trang)",
        value: data.length,
        tone: "from-sky-500/15 to-cyan-500/5",
      },
      {
        label: "Số đơn hàng",
        value: totals.paidOrders,
        tone: "from-purple-500/15 to-pink-500/5",
      },
      {
        label: "Tổng thu (Tiền mặt)",
        value: formatMoney(totals.generatedCash),
        tone: "from-emerald-500/15 to-teal-500/5",
      },
      {
        label: "Tổng Chênh lệch",
        value: formatMoney(totals.cashDifference),
        tone: "from-amber-500/15 to-orange-500/5",
      },
    ],
    [
      data.length,
      totals.paidOrders,
      totals.generatedCash,
      totals.cashDifference,
    ]
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-shell space-y-6 p-6 min-h-screen bg-background print:bg-card text-card-foreground print:p-0">
      <div className="report-card flex items-center justify-between gap-4 rounded-2xl border bg-card text-card-foreground p-5 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-200">
            Báo cáo ca làm việc
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Báo cáo ca làm việc
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi dòng tiền và đơn hàng theo từng ca
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Printer className="mr-2 h-4 w-4" />
            In báo cáo
          </Button>

          <Select
            value={selectedStaff}
            onValueChange={handleStaffChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px] transition-shadow duration-200 focus:shadow-md">
              <SelectValue placeholder="Tất cả nhân viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {staffs.map((staff) => (
                <SelectItem key={staff.id} value={staff.id.toString()}>
                  {staff.first_name} {staff.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterType}
            onValueChange={handleFilterChange}
            disabled={loading}
          >
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
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal transition-shadow duration-200 focus:shadow-md"
                  >
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
                    onSelect={(value) => {
                      setDateRange(value ?? { from: undefined, to: undefined });
                      setPagination((p) => ({ ...p, currentPage: 1 }));
                    }}
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
        <h1 className="text-2xl font-bold uppercase">Báo cáo ca làm việc</h1>
        <p className="mt-2 text-sm">
          Từ ngày: {format(dateRange.from, "dd/MM/yyyy")} - Đến ngày:{" "}
          {format(dateRange.to, "dd/MM/yyyy")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 print:hidden">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`report-card rounded-2xl border bg-gradient-to-br ${metric.tone} p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {metric.label}
            </p>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="report-card flex flex-col relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 print:border-none print:shadow-none">
        {isRefreshing && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-card/70 dark:bg-slate-900/70 py-3 backdrop-blur-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Đang cập nhật dữ liệu
            </span>
          </div>
        )}
        <div
          className={`overflow-x-auto transition-opacity duration-300 ${
            isRefreshing ? "opacity-70" : "opacity-100"
          }`}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[1] bg-muted/50 backdrop-blur">
              <tr className="border-b font-medium text-foreground">
                <th className="px-4 py-3 text-left">Mã Ca</th>
                <th className="px-4 py-3 text-left">Nhân viên</th>
                <th className="px-4 py-3 text-left">Mở ca lúc</th>
                <th className="px-4 py-3 text-left">Đóng ca lúc</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
                <th className="px-4 py-3 text-right">Tiền đầu ca</th>
                <th className="px-4 py-3 text-right">Thu</th>
                <th className="px-4 py-3 text-right">Tiền cuối ca (TT)</th>
                <th className="px-4 py-3 text-right">Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {data.map((session, index) => {
                let generatedCash = 0;
                let isDiff = false;

                if (session.closed_at) {
                  generatedCash =
                    toNumber(session.closing_cash_system) -
                    toNumber(session.opening_cash);
                  isDiff = toNumber(session.cash_difference) !== 0;
                }

                return (
                  <tr
                    key={session.id}
                    className="report-row border-b transition-colors hover:bg-muted dark:hover:bg-muted/50"
                    style={{ "--row-index": index }}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {session.code}
                    </td>
                    <td className="px-4 py-3">
                      {session.first_name} {session.last_name}
                    </td>
                    <td className="px-4 py-3">
                      {session.opened_at
                        ? format(new Date(session.opened_at), "HH:mm dd/MM")
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      {session.closed_at ? (
                        format(new Date(session.closed_at), "HH:mm dd/MM")
                      ) : (
                        <span className="text-amber-600">Đang mở</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {session.paid_orders_count || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(session.opening_cash)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {session.closed_at
                        ? `+${formatMoney(generatedCash)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {session.closed_at && session.closing_cash_actual != null
                        ? formatMoney(session.closing_cash_actual)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        isDiff
                          ? toNumber(session.cash_difference) > 0
                            ? "text-blue-600"
                            : "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {session.closed_at && session.cash_difference != null
                        ? formatMoney(session.cash_difference)
                        : "—"}
                    </td>
                  </tr>
                );
              })}

              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground italic"
                  >
                    Không tìm thấy dữ liệu ca làm việc trong khoảng thời gian
                    này
                  </td>
                </tr>
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot className="bg-muted dark:bg-muted/50 font-bold border-t-2">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-foreground border-r"
                  >
                    TỔNG CỘNG TRANG
                  </td>
                  <td className="px-4 py-4 text-right border-r text-blue-600">
                    {totals.paidOrders}
                  </td>
                  <td className="px-4 py-4 text-right border-r">
                    {formatMoney(totals.openingCash)}
                  </td>
                  <td className="px-4 py-4 text-right border-r text-emerald-600">
                    +{formatMoney(totals.generatedCash)}
                  </td>
                  <td className="px-4 py-4 text-right border-r">—</td>
                  <td className="px-4 py-4 text-right text-lg">
                    {formatMoney(totals.cashDifference)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Section */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 print:hidden">
            <div className="text-sm text-muted-foreground">
              Hiển thị{" "}
              <span className="font-medium text-foreground">{data.length}</span>{" "}
              trong{" "}
              <span className="font-medium text-foreground">
                {pagination.total}
              </span>{" "}
              bản ghi
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: Math.max(1, p.currentPage - 1),
                  }))
                }
                disabled={pagination.currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center min-w-8 text-sm font-medium">
                {pagination.currentPage} / {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: Math.min(p.totalPages, p.currentPage + 1),
                  }))
                }
                disabled={
                  pagination.currentPage === pagination.totalPages || loading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes reportFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .report-shell { animation: reportFadeUp 320ms ease-out; }
        .report-card { animation: reportFadeUp 420ms ease-out both; }
        .report-row { animation: reportFadeUp 280ms ease-out both; animation-delay: calc(var(--row-index) * 18ms); }
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block *, table, table *, .print\\:flex, .print\\:flex * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
          table { border-collapse: collapse !important; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
          th { background-color: #bce4f5 !important; -webkit-print-color-adjust: exact; }
        }
      `,
        }}
      />
    </div>
  );
};

export default AdminShiftReport;
