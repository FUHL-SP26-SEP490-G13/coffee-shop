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
import { LayoutDashboard } from "lucide-react";

const formatMoney = (n) => `${Number(n || 0).toLocaleString()}đ`;

function fillMissingDates(series, days) {
  // series: [{date:'YYYY-MM-DD', revenue:number}]
  const map = new Map(series.map((x) => [x.date, x.revenue]));
  const result = [];

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, revenue: map.get(key) ?? 0 });
  }
  return result;
}

export default function AdminDB() {
  const [rangeDays, setRangeDays] = useState(7);

  const [overview, setOverview] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [orderTypeRevenue, setOrderTypeRevenue] = useState([]);
  const [comparison, setComparison] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrors(null);

      const ov = await adminDBService.getOverview();
      setOverview(ov);

      const series = await adminDBService.getRevenueSeries(rangeDays);
      setRevenueSeries(series);

      const top = await adminDBService.getTopProducts({
        days: rangeDays,
        limit: 5,
      });
      setTopProducts(top);

      const orderType = await adminDBService.getOrderTypeRevenue(rangeDays);
      setOrderTypeRevenue(orderType);

      const cmp = await adminDBService.getComparison(rangeDays);
      setComparison(cmp);
    } catch (err) {
      console.error("Dashboard error:", err);
      setErrors("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const chartData = useMemo(
    () => fillMissingDates(revenueSeries || [], rangeDays),
    [revenueSeries, rangeDays]
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
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-1">Tổng quan cửa hàng</h2>
            <p className="text-sm text-muted-foreground">
              Khái quát chung cửa hàng của bạn
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={rangeDays === 7 ? "default" : "outline"}
            onClick={() => setRangeDays(7)}
          >
            7 ngày
          </Button>
          <Button
            variant={rangeDays === 30 ? "default" : "outline"}
            onClick={() => setRangeDays(30)}
          >
            30 ngày
          </Button>
          <Button variant="outline" onClick={loadData}>
            Refresh
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
                Doanh thu {rangeDays} ngày
              </h3>
              <p className="text-sm text-muted-foreground">
                Tính theo đơn đã thanh toán (orders.is_paid = 1)
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
            {rangeDays} ngày gần nhất
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
          {rangeDays} ngày gần nhất
        </p>

        {orderTypeRevenue.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTypeRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="revenue" />
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
            className={`text-2xl font-bold ${
              comparison.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
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
