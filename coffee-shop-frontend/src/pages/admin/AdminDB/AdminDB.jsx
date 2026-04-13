import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import adminDBService from "@/services/adminDBService";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfYear, endOfDay, startOfDay, differenceInDays } from "date-fns";
import { CalendarIcon, LayoutDashboard, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const formatMoney = (n) => `${Number(n || 0).toLocaleString()}đ`;

const getOrderTypeLabel = (type) => {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "delivery") return "Giao hàng";
  if (normalized === "dine-in" || normalized === "dinein") return "Tại quán";
  if (normalized === "takeaway" || normalized === "take-away") return "Mang đi";
  return type || "Khác";
};
//  Doanh thu theo ngày trong khoảng thời gian đã chọn (dạng series để vẽ biểu đồ)
function fillMissingDates(series, startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return series;
  const map = new Map(series.map((x) => [x.date, x.revenue]));
  const result = [];

  let current = startOfDay(new Date(startDateStr));
  const end = startOfDay(new Date(endDateStr));

  while (current <= end) {
    const key = format(current, "yyyy-MM-dd");
    result.push({ date: key, revenue: map.get(key) ?? 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}
// Top sản phẩm bán chạy nhất trong khoảng thời gian đã chọn
export default function AdminDB() {
  const [rangeType, setRangeType] = useState("7"); // '7', '30', 'year', 'custom'
  const [customRange, setCustomRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  const [dateInfo, setDateInfo] = useState({
    startDate: "",
    endDate: "",
    displayDays: 7
  });

  const [overview, setOverview] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
// top 5 sản phẩm bán chạy nhất trong khoảng thời gian
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(null);

  const [orderTypeRevenue, setOrderTypeRevenue] = useState([]);
  const [comparison, setComparison] = useState(null);

  const loadData = async (dates) => {
    try {
      setLoading(true);
      setErrors(null);

      const [ov, series, top, orderType, cmp] = await Promise.all([
        adminDBService.getOverview(),
        adminDBService.getRevenueSeries({
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
        adminDBService.getTopProducts({
          startDate: dates.startDate,
          endDate: dates.endDate,
          limit: 5,
        }),
        adminDBService.getOrderTypeRevenue({
          startDate: dates.startDate,
          endDate: dates.endDate,
        }),
        adminDBService.getComparison({
          startDate: dates.startDate,
          endDate: dates.endDate,
          prevStartDate: dates.prevStartDate,
          prevEndDate: dates.prevEndDate,
        }),
      ]);

      setOverview(ov);
      setRevenueSeries(series);
      setTopProducts(top);
      setOrderTypeRevenue(orderType);
      setComparison(cmp);
    } catch (err) {
      console.error("Dashboard error:", err);
      setErrors("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getFilterDates = (type, custom) => {
    let start, end;
    const now = new Date();

    if (type === "7") {
      start = subDays(now, 6);
      end = now;
    } else if (type === "30") {
      start = subDays(now, 29);
      end = now;
    } else if (type === "year") {
      start = startOfYear(now);
      end = now;
    } else if (type === "custom" && custom?.from) {
      start = custom.from;
      end = custom.to || now;
    } else {
      start = subDays(now, 6);
      end = now;
    }

    const startDate = format(startOfDay(start), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(end), "yyyy-MM-dd HH:mm:ss");

    const duration = differenceInDays(end, start) + 1;
    const prevStart = subDays(start, duration);
    const prevEnd = subDays(start, 1);

    const prevStartDate = format(startOfDay(prevStart), "yyyy-MM-dd HH:mm:ss");
    const prevEndDate = format(endOfDay(prevEnd), "yyyy-MM-dd HH:mm:ss");

    return {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      displayDays: duration,
    };
  };

  const handleApplyFilter = () => {
    const dates = getFilterDates(rangeType, customRange);
    setDateInfo(dates);
    loadData(dates);
  };

  useEffect(() => {
    // Initial load
    const initialDates = getFilterDates("7", null);
    setDateInfo(initialDates);
    loadData(initialDates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(
    () => fillMissingDates(revenueSeries || [], dateInfo.startDate, dateInfo.endDate),
    [revenueSeries, dateInfo]
  );

  if (loading) {
    return <div className="p-6">Đang tải dashboard...</div>;
  }

  if (errors) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{errors}</p>

        <Button variant="outline" className="mt-4" onClick={loadData}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!overview) {
    return <div className="p-6">Không có dữ liệu dashboard</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold">Tổng quan cửa hàng</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {rangeType === "custom" && (
            <div className={cn("grid gap-2")}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal",
                      !customRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customRange?.from ? (
                      customRange.to ? (
                        <>
                          {format(customRange.from, "dd/MM/yyyy")} -{" "}
                          {format(customRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(customRange.from, "dd/MM/yyyy")
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
                    defaultMonth={customRange?.from}
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Select value={rangeType} onValueChange={setRangeType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
              <SelectItem value="custom">Tùy chọn</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleApplyFilter}
            className="flex items-center gap-2"
          >
            Lọc
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleApplyFilter}
            title="Làm mới"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground">Doanh thu hôm nay</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatMoney(overview.revenueToday)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground">Đơn hôm nay</h3>
          <p className="text-2xl font-bold">{overview.ordersToday}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground">Tổng người dùng</h3>
          <p className="text-2xl font-bold">{overview.totalUsers}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground">
            Mã giảm giá hoạt động
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {overview.activeDiscounts}
          </p>
        </Card>

      </div>

      {/* Chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Doanh thu {dateInfo.displayDays} ngày
              </h3>
              <p className="text-sm text-muted-foreground">
                Tính theo đơn đã thanh toán
              </p>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top products */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1">Top 5 bán chạy</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {dateInfo.displayDays} ngày gần nhất
          </p>

          {topProducts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.productId}
                  className="flex items-start justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      #{idx + 1} {p.productName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SL: {p.quantitySold} • Doanh thu: {formatMoney(p.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>



      {/* doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng) - optional nhưng nếu có thì rất hợp DB vì có order_type trong bảng orders, khỏi phải đoán dựa vào payment_method hay gì đó */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">Doanh thu theo loại đơn</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {dateInfo.displayDays} ngày gần nhất
        </p>

        {orderTypeRevenue.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTypeRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tickFormatter={getOrderTypeLabel} />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  labelFormatter={(label) => `Loại đơn: ${getOrderTypeLabel(label)}`}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>



      {/* Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian (ví dụ: tuần này vs tuần trước, tháng này vs tháng trước) để xem xu hướng tăng giảm */}
      <Card className="p-6">
        <h3 className="text-sm text-muted-foreground">Tăng trưởng doanh thu</h3>

        {!comparison ? (
          <div className="text-sm text-muted-foreground">...</div>
        ) : (
          <div
            className={`text-2xl font-bold ${comparison.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
          >
            {comparison.revenueGrowth >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(comparison.revenueGrowth)}%
          </div>
        )}
      </Card>


    </div>
  );
}
