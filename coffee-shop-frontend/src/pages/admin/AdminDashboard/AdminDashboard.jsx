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
  BarChart, Bar,
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

  const [orderTypeRevenue, setOrderTypeRevenue] = useState([]);
  const [tableSummary, setTableSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [staffSummary, setStaffSummary] = useState(null);
  console.log("staffSummary:", staffSummary);

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

      // 5) order type revenue (optional)
      const orderType = await adminDashService.getOrderTypeRevenue(rangeDays);
      setOrderTypeRevenue(orderType);

      // 6) table status summary (optional)
      const table = await adminDashService.getTableStatusSummary();
      setTableSummary(table);

      // 7) comparison (optional)
      const cmp = await adminDashService.getComparison(rangeDays);
      setComparison(cmp);

      // 8) staff summary (optional)
      const staff = await adminDashService.getStaffSummary();
      setStaffSummary(staff);
    } finally {
      setLoading(false);
    }
  };

//   const loadData = async () => {
//   try {
//     setLoading(true);

//     // Các API bắt buộc - nếu lỗi thì báo
//     const ov = await adminDashService.getOverview();
//     setOverview(ov);

//     const series = await adminDashService.getRevenueSeries(rangeDays);
//     setRevenueSeries(series);

//     const top = await adminDashService.getTopProducts({ days: rangeDays, limit: 5 });
//     setTopProducts(top);

//     // Các API optional - lỗi thì bỏ qua, không crash
//     await adminDashService.getPaymentMethodBreakdown(rangeDays)
//       .then(setPaymentMethod).catch(() => {});

//     await adminDashService.getOrderTypeRevenue(rangeDays)
//       .then(setOrderTypeRevenue).catch(() => {});

//     await adminDashService.getTableStatusSummary()
//       .then(setTableSummary).catch(() => {}); // ← đây đang 404

//     await adminDashService.getComparison(rangeDays)
//       .then(setComparison).catch(() => {});

//     await adminDashService.getStaffSummary()
//       .then(setStaffSummary).catch(() => {}); // ← giờ sẽ chạy được

//   } catch (err) {
//     console.error("loadData error:", err);
//   } finally {
//     setLoading(false);
//   }
// };

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

      {/* Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">Tình trạng bàn (Dine-in)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Hiện tại trong hệ thống
        </p>

        {!tableSummary ? (
          <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Tổng bàn</div>
              <div className="text-2xl font-semibold">{tableSummary.total}</div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Đang sử dụng</div>
              <div className="text-2xl font-semibold text-orange-600">
                {tableSummary.occupied}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Bàn trống</div>
              <div className="text-2xl font-semibold text-green-600">
                {tableSummary.available}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</div>
              <div
                className={`text-2xl font-semibold ${
                  tableSummary.occupancyRate >= 70
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {tableSummary.occupancyRate}%
              </div>
            </div>
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

{/* Optional: tóm tắt số lượng nhân viên theo vai trò (barista, phục vụ, quản lý) để dashboard có thêm vài số liệu hữu ích */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tình hình nhân sự</h3>

        {!staffSummary ? (
          <div className="text-sm text-muted-foreground">Chưa có dữ liệu</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Nhân viên có ca
              </div>
              <div className="text-2xl font-semibold">
                {staffSummary.activeShifts}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Đơn xin nghỉ chờ duyệt
              </div>
              <div className="text-2xl font-semibold text-orange-600">
                {staffSummary.pendingLeave}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Giờ tăng ca (7 ngày)
              </div>
              <div className="text-2xl font-semibold text-blue-600">
                {staffSummary.overtimeHours}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
