import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  ChefHat,
  Users,
  Clock,
  Calendar,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  Package,
} from "lucide-react";
import authenticationService from "@/services/authenticationService";
import staffDBService from "@/services/staffDBService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    authenticationService
      .getProfile()
      .then((res) => {
        const userData = res?.data?.id
          ? res.data
          : res?.data?.data || res?.data;
        setUser(userData);
      })
      .catch(console.error);

    staffDBService
      .getOverview()
      .then((res) => {
        if (res?.data?.success) {
          setDashboardData(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const stats = [
    {
      title: "Đơn Takeaway",
      description: "Chờ xử lý",
      value: dashboardData ? dashboardData.takeawayPending : "...",
      icon: ShoppingBag,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/40/50",
      link: "/staff/takeaway",
    },
    {
      title: "Đơn Giao hàng",
      description: "Đang chờ giao",
      value: dashboardData ? dashboardData.deliveryWaiting : "...",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/40/50",
      link: "/staff/delivery",
    },
    {
      title: "Khu vực Bếp",
      description: "Món đang làm",
      value: dashboardData ? dashboardData.kitchenPreparingItems : "...",
      icon: ChefHat,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/40/50",
      link: "/staff/kitchen",
    },
    {
      title: "Ca của bạn",
      description: "Hôm nay",
      value: dashboardData ? dashboardData.shiftStatus : "...",
      icon: Clock,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/40/50",
      link: "/staff/attendance",
    },
  ];

  const quickActions = [
    {
      label: "Bán hàng POS",
      icon: TrendingUp,
      path: "/staff/pos",
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
    {
      label: "Lịch làm việc",
      icon: Calendar,
      path: "/staff/schedule",
      color: "bg-white dark:bg-gray-900 border text-foreground hover:bg-accent",
    },

    {
      label: "Danh sách Bàn",
      icon: Users,
      path: "/staff/tables",
      color: "bg-white dark:bg-gray-900 border text-foreground hover:bg-accent",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Chào mừng trở lại, {user?.last_name || user?.first_name || "Trưởng ca"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Dưới đây là tổng quan tình trạng hoạt động của cửa hàng lúc này
          </p>
        </div>
        <Button onClick={() => navigate("/staff/takeaway")} className="gap-2">
          <LayoutGrid className="w-4 h-4" />
          Mở màn hình Takeaway
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <Card className="p-6 transition-all hover:shadow-md dark:shadow-none hover:border-primary/50 cursor-pointer h-full border-border/60">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Lối tắt thao tác nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all shadow-sm dark:shadow-none ${action.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <Card className="p-0 overflow-hidden border-border/60">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-sm">Tin nhắn & Yêu cầu nội bộ</h3>
          </div>
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
            Không có yêu cầu nào đang chờ xử lý.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => navigate("/staff/requests")}
            >
              Xem tất cả
            </Button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="p-6 flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Đừng quên điểm danh!</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[80%]">
              Hãy nhớ check-in khi bắt đầu ca và check-out khi kết thúc ca làm việc của mình nhé.
            </p>
            <Button onClick={() => navigate("/staff/attendance")}>
              Điểm danh ngay
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
