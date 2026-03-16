import { useEffect, useMemo, useState } from "react";
import {
  PackageOpen,
  TrendingUp,
  Clock,
  Coffee,
  AlertCircle,
  CheckCircle,
  Activity,
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
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`${color} p-3 rounded-lg text-white`}>
            <Icon className="w-6 h-6" />
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
    const hour = d.getHours();

    result.push({
      hour,
      orders: map.get(hour) || 0,
    });
  }

  return result;
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
  const [hoursRange] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const overviewRes = await baristaDashboardService.getOverview();
      const trendsRes = await baristaDashboardService.getOrderTrends(
        hoursRange
      );

      const overview = overviewRes?.data || overviewRes || {};
      const trends = trendsRes?.data || trendsRes || [];

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
    } catch (err) {
      console.error("Failed to fetch barista dashboard data:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu dashboard"
      );
      setOrderStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    <div className="flex-1 p-8">
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Đang tải dashboard...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {error && (
            <Card className="mb-8 bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
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
                <h1 className="text-3xl font-semibold">Tổng quan</h1>
                <p className="text-muted-foreground mt-1">
                  Hoạt động pha chế hôm nay
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium capitalize">
                  {dashboardData.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={PackageOpen}
              title="Đơn hàng chờ"
              value={pending}
              subtitle="Cần xử lý ngay"
              color="bg-orange-500"
            />
            <StatCard
              icon={Coffee}
              title="Đã hoàn thành"
              value={completed}
              subtitle="Hôm nay"
              color="bg-green-500"
            />
            <StatCard
              icon={CheckCircle}
              title="Sẵn sàng"
              value={ready}
              subtitle="Chờ lấy"
              color="bg-blue-500"
            />
            <StatCard
              icon={Clock}
              title="Thời gian trung bình"
              value={`${dashboardData.avgPrepTime} min`}
              subtitle="Pha chế"
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Trình trạng đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Sẵn sàng</span>
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
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              ) : (
                <div className="flex items-end justify-between h-64 gap-2">
                  {chartData.map((stat, idx) => (
                    <div
                      key={`${stat.hour}-${idx}`}
                      className="flex-1 flex flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{
                          height: `${(stat.orders / maxOrders) * 100}%`,
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

          <Card>
            <CardHeader>
              <CardTitle>Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bắt đầu ca làm việc
                </Button>
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Chấm công
                </Button>
                <Button variant="outline">
                  <Coffee className="w-4 h-4 mr-2" />
                  Báo cáo sự cố
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
