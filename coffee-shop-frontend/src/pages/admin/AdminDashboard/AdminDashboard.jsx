import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import adminDashService from "@/services/adminDashboardService";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Newspaper } from "lucide-react";

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

export default function AdminDashboard() {
  const [rangeDays, setRangeDays] = useState(7);

  const [overview, setOverview] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1) overview (có sẵn series7 + top5 nếu muốn dùng luôn)
      const ov = await adminDashService.getOverview();
      setOverview(ov);

      // 2) chart theo range chọn
      const series = await adminDashService.getRevenueSeries(rangeDays);
      setRevenueSeries(series);

      // 3) top products theo range chọn
      const top = await adminDashService.getTopProducts({
        days: rangeDays,
        limit: 5,
      });
      setTopProducts(top);

      // 4) payment breakdown (optional nhưng hợp DB)
      const pm = await adminDashService.getPaymentMethodBreakdown(rangeDays);
      setPaymentMethod(pm);
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

  if (loading) return <div className="p-6">Đang tải dashboard...</div>;
  if (!overview) return <div className="p-6">Không có dữ liệu dashboard</div>;
  console.log("overview:", overview);


  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-2xl font-semibold">Tổng quan dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Tổng quan hoạt động cửa hàng
          </p>
        </div> */}
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold mb-1">Tổng quan cửa hàng</h1>
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

        <Card className="p-6">
          <h3 className="text-sm text-muted-foreground">Email đăng ký</h3>
          <p className="text-2xl font-bold text-purple-600">
            {overview.totalNewsletterSubscribers}
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

      {/* Payment breakdown (bonus, hợp DB order_payments) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">
          Doanh thu theo phương thức
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {rangeDays} ngày gần nhất
        </p>

        {paymentMethod.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {paymentMethod.map((x) => (
              <div key={x.method} className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">{x.method}</div>
                <div className="text-xl font-semibold">
                  {formatMoney(x.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
