import { useEffect, useMemo, useState } from "react";
import {
  PackageOpen,
  TrendingUp,
  Clock,
  Coffee,
  AlertCircle,
  CheckCircle,
  Activity,
  Flame,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import baristaDashboardService from "../../../services/baristaDBService";

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "bg-blue-500",
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`${color} rounded-lg p-3 text-white`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function fillMissingHours(series, hours = 6) {
  const safeHours = Math.max(1, Math.min(Number(hours) || 6, 24));
  const now = new Date();
  const map = new Map(
    (series || []).map((item) => [Number(item.hour), Number(item.orders)])
  );

  const result = [];
  for (let i = safeHours - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(now.getHours() - i);

    result.push({
      hour: d.getHours(),
      orders: map.get(d.getHours()) || 0,
    });
  }

  return result;
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "preparing":
      return "Đang pha chế";
    case "served":
      return "Đã pha xong";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "-";
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "preparing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "served":
      return "bg-green-100 text-green-700 border-green-200";
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getNextStatus(status) {
  switch (status) {
    case "pending":
      return "preparing";
    case "preparing":
      return "served";
    case "served":
      return "completed";
    default:
      return null;
  }
}

function getNextStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Bắt đầu pha";
    case "preparing":
      return "Đánh dấu đã xong";
    case "served":
      return "Hoàn thành";
    default:
      return null;
  }
}

export function BaristaDB() {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedToday: 0,
    readyOrders: 0,
    preparingOrders: 0,
    avgPrepTime: 0,
    status: "online",
  });

  const [orderStats, setOrderStats] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [delayedOrders, setDelayedOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [hoursRange] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewRes,
        trendsRes,
        activeOrdersRes,
        delayedOrdersRes,
        topProductsRes,
      ] = await Promise.all([
        baristaDashboardService.getOverview(),
        baristaDashboardService.getOrderTrends(hoursRange),
        baristaDashboardService.getActiveOrders(),
        baristaDashboardService.getDelayedOrders(15),
        baristaDashboardService.getTopProductsToday(5),
      ]);

      const overview = overviewRes?.data || {};
      const trends = trendsRes?.data || [];
      const activeOrdersData = activeOrdersRes?.data || [];
      const delayedOrdersData = delayedOrdersRes?.data || [];
      const topProductsData = topProductsRes?.data || [];

      setDashboardData({
        totalOrders: Number(overview.totalOrders || 0),
        pendingOrders: Number(overview.pendingOrders || 0),
        completedToday: Number(overview.completedToday || 0),
        readyOrders: Number(overview.readyOrders || 0),
        preparingOrders: Number(overview.preparingOrders || 0),
        avgPrepTime: Number(overview.avgPrepTime || 0),
        status: "online",
      });

      setOrderStats(Array.isArray(trends) ? trends : []);
      setActiveOrders(Array.isArray(activeOrdersData) ? activeOrdersData : []);
      setDelayedOrders(
        Array.isArray(delayedOrdersData) ? delayedOrdersData : []
      );
      setTopProducts(Array.isArray(topProductsData) ? topProductsData : []);
    } catch (err) {
      console.error("Failed to fetch barista dashboard data:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu dashboard"
      );
      setOrderStats([]);
      setActiveOrders([]);
      setDelayedOrders([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickUpdateStatus = async (orderId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    try {
      setActionLoadingId(orderId);
      setError("");
      await baristaDashboardService.updateOrderStatus(orderId, nextStatus);
      await fetchDashboardData();
    } catch (err) {
      console.error("Update order status failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể cập nhật trạng thái đơn"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const pending = dashboardData.pendingOrders;
  const ready = dashboardData.readyOrders;
  const completed = dashboardData.completedToday;
  const preparing = dashboardData.preparingOrders;

  const chartData = useMemo(
    () => fillMissingHours(orderStats, hoursRange),
    [orderStats, hoursRange]
  );

  const maxOrders = Math.max(...chartData.map((s) => s.orders), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {loading && (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Đang tải dashboard...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">
                        Lỗi tải dữ liệu
                      </p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>

                  <Button variant="outline" onClick={fetchDashboardData}>
                    Thử lại
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Tổng quan</h1>
                <p className="mt-1 text-muted-foreground">
                  Hoạt động pha chế hôm nay
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-sm font-medium capitalize">
                  {dashboardData.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={PackageOpen}
              title="Đơn hàng chờ"
              value={pending}
              subtitle="Cần xử lý ngay"
              color="bg-orange-500"
            />
            <StatCard
              icon={Activity}
              title="Đang pha chế"
              value={preparing}
              subtitle="Đang thực hiện"
              color="bg-blue-500"
            />
            <StatCard
              icon={CheckCircle}
              title="Đã pha xong"
              value={ready}
              subtitle="Chờ giao / phục vụ"
              color="bg-green-500"
            />
            <StatCard
              icon={Clock}
              title="Thời gian trung bình"
              value={`${dashboardData.avgPrepTime} min`}
              subtitle="Hoàn tất đơn"
              color="bg-purple-500"
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Trình trạng đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Chờ xử lý</span>
                      </div>
                      <span className="text-lg font-bold">{pending}</span>
                    </div>
                    <Progress
                      value={Math.min((pending / 20) * 100, 100)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">
                          Đang pha chế
                        </span>
                      </div>
                      <span className="text-lg font-bold">{preparing}</span>
                    </div>
                    <Progress
                      value={Math.min((preparing / 20) * 100, 100)}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Đã pha xong</span>
                      </div>
                      <span className="text-lg font-bold">{ready}</span>
                    </div>
                    <Progress
                      value={Math.min((ready / 20) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt hôm nay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng đơn hàng
                    </span>
                    <span className="font-bold">
                      {dashboardData.totalOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Hoàn thành
                    </span>
                    <span className="font-bold text-green-600">
                      {completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chưa xử lý
                    </span>
                    <span className="font-bold text-orange-600">{pending}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tỷ lệ hoàn thành
                      </span>
                      <span className="font-bold">
                        {dashboardData.totalOrders > 0
                          ? Math.round(
                              (dashboardData.completedToday /
                                dashboardData.totalOrders) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Xu hướng đơn hàng ({hoursRange} giờ qua)</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              ) : (
                <div className="flex h-64 items-end justify-between gap-2">
                  {chartData.map((stat, idx) => (
                    <div
                      key={`${stat.hour}-${idx}`}
                      className="flex flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{
                          height: `${Math.max(
                            (stat.orders / maxOrders) * 100,
                            6
                          )}%`,
                        }}
                        title={`${stat.orders} đơn`}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {String(stat.hour).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Top sản phẩm hôm nay</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.totalOrders} đơn
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-green-600">
                          <Flame className="h-4 w-4" />
                          {product.totalSold}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


        </>
      )}
    </div>
  );
}
