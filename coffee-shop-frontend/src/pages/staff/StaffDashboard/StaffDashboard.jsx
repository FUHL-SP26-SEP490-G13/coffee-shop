import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Package,
} from "lucide-react";
import authenticationService from "@/services/authenticationService";
import staffDBService from "@/services/staffDBService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moneyFormatter = new Intl.NumberFormat("vi-VN");
const formatMoney = (v) => moneyFormatter.format(Number(v) || 0);

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
      title: "Đơn hàng",
      description: "Đang chờ giao",
      value: dashboardData ? dashboardData.deliveryWaiting : "...",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/40/50",
      link: "/staff/orders/management",
    },
    {
      title: "Doanh thu theo ca",
      description: dashboardData?.currentShiftName ?? "Không có ca",
      value: dashboardData ? formatMoney(dashboardData.shiftRevenue) : "...",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/40/50",
      link: "/staff/attendance",
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
    <div className="relative overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6">
      <style>{`
        @keyframes dashboardFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashboardFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
        }
        @keyframes dashboardGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }
        .dashboard-fade-in {
          animation: dashboardFadeUp 420ms ease-out both;
        }
        .dashboard-fade-in-delayed {
          animation: dashboardFadeUp 520ms ease-out 90ms both;
        }
        .dashboard-fade-in-late {
          animation: dashboardFadeUp 620ms ease-out 160ms both;
        }
        .dashboard-float {
          animation: dashboardFloat 7s ease-in-out infinite;
        }
        .dashboard-glow {
          animation: dashboardGlow 8s ease-in-out infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dashboard-glow absolute -top-16 right-[-6rem] h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="dashboard-glow absolute top-40 left-[-4rem] h-56 w-56 rounded-full bg-blue-500/10 blur-3xl [animation-delay:1.5s]" />
        <div className="dashboard-glow absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl [animation-delay:3s]" />
      </div>

      <div className="relative dashboard-fade-in rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-5 sm:p-6 shadow-sm dark:shadow-none">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Bảng điều khiển nhân viên
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Chào mừng trở lại, {user?.last_name || user?.first_name || "Trưởng ca"}!
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground leading-6">
                Dưới đây là tổng quan tình trạng hoạt động của cửa hàng lúc này, với các lối tắt và số liệu đang cập nhật theo thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            <div className="rounded-2xl border border-border/100 bg-card/100 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trạng thái</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Sẵn sàng phục vụ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link} className="dashboard-fade-in" style={{ animationDelay: `${80 + index * 70}ms` }}>
              <Card className="group h-full border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 dark:shadow-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight transition-colors group-hover:text-primary">
                      {stat.value}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 ring-1 ring-inset ring-black/5 transition-transform duration-300 group-hover:scale-110 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="dashboard-fade-in-delayed rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-sm dark:shadow-none">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Lối tắt thao tác nhanh</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Đi thẳng tới các màn hình hay dùng nhất.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`dashboard-float flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${action.color}`}
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dashboard-fade-in-late pt-1">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-sm dark:shadow-none">
          <div className="relative p-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(194,94,40,0.12),transparent_60%)]" />
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="relative mb-2 text-lg font-semibold">Đừng quên điểm danh!</h3>
            <p className="relative mx-auto mb-6 max-w-xl text-sm leading-6 text-muted-foreground">
              Hãy nhớ check-in khi bắt đầu ca và check-out khi kết thúc ca làm việc của mình nhé.
            </p>
            <Button onClick={() => navigate("/staff/attendance")} className="relative shadow-sm transition-all hover:-translate-y-0.5">
              Điểm danh ngay
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
