import { useEffect, useState } from "react";
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
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import baristaDashboardService from "../../services/baristaDashboardService";

// Define StatCard outside component to avoid creating components during render
const StatCard = (props) => {
  const { icon: Icon, title, value, subtitle, color = "bg-blue-500" } = props;

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

export function BaristaDashboard() {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard overview data
        const overviewRes = await baristaDashboardService.getOverview();

        // Fetch order trends
        const trendsRes = await baristaDashboardService.getOrderTrends(6);

        // Validate and set dashboard data from backend
        const overview = overviewRes?.data || overviewRes || {};

        setDashboardData({
          totalOrders: overview.totalOrders || 0,
          pendingOrders: overview.pendingOrders || 0,
          completedToday: overview.completedToday || 0,
          readyOrders: overview.readyOrders || 0,
          preparingOrders: overview.preparingOrders || 0,
          avgPrepTime: overview.avgPrepTime || 8,
          status: "online",
        });

        // Set trends data with proper validation
        const trends = trendsRes?.data || trendsRes || [];
        if (Array.isArray(trends)) {
          setOrderStats(trends);
        } else if (trends && Array.isArray(trends.data)) {
          setOrderStats(trends.data);
        } else {
          // Use default trends if API returns nothing
          setOrderStats([
            { hour: 10, orders: 5 },
            { hour: 11, orders: 8 },
            { hour: 12, orders: 6 },
            { hour: 13, orders: 10 },
            { hour: 14, orders: 7 },
            { hour: 15, orders: 9 },
          ]);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch barista dashboard data:", err);
        setError(err.message || "Không thể tải dữ liệu dashboard");

        // Fall back to static data if API fails
        setOrderStats([
          { hour: 10, orders: 5 },
          { hour: 11, orders: 8 },
          { hour: 12, orders: 6 },
          { hour: 13, orders: 10 },
          { hour: 14, orders: 7 },
          { hour: 15, orders: 9 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pending = dashboardData.pendingOrders;
  const ready = dashboardData.readyOrders;
  const completed = dashboardData.completedToday;
  const preparing = dashboardData.preparingOrders;

  return (
    <div className="flex-1 p-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Đang tải dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="mb-8 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Lỗi tải dữ liệu</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Tổng quan hoạt động pha chế hôm nay
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

          {/* Key Metrics */}
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Orders by Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Trình trạng đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pending */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">Chờ xử lý</span>
                      </div>
                      <span className="text-lg font-bold">{pending}</span>
                    </div>
                    <Progress value={(pending / 20) * 100} className="h-2" />
                  </div>

                  {/* Preparing */}
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
                    <Progress value={(preparing / 20) * 100} className="h-2" />
                  </div>

                  {/* Ready */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Sẵn sàng</span>
                      </div>
                      <span className="text-lg font-bold">
                        {dashboardData.readyOrders}
                      </span>
                    </div>
                    <Progress value={(ready / 20) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
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

          {/* Orders Trend Chart */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Xu hướng đơn hàng (6 giờ qua)</CardTitle>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-64 gap-2">
                {orderStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${(stat.orders / 12) * 100}%` }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      {stat.hour}:00
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
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
