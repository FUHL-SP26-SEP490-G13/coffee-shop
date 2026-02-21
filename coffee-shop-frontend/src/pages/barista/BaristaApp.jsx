import { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  PackageOpen,
  Calendar,
  Clock,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import authenticationService from "../../services/authenticationService";

export function BaristaApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authenticationService.logout();
    window.location.href = "/";
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("orders")) return "orders";
    if (path.includes("attendance")) return "attendance";
    if (path.includes("schedule")) return "schedule";
    if (path.includes("requests")) return "requests";
    if (path.includes("profile")) return "profile";
    return "dashboard";
  };

  const currentPage = getCurrentPage();

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/barista" },
    { id: "orders", icon: PackageOpen, label: "Đơn hàng", path: "/barista/orders" },
    { id: "attendance", icon: Clock, label: "Chấm công", path: "/barista/attendance" },
    { id: "schedule", icon: Calendar, label: "Lịch làm việc", path: "/barista/schedule" },
    { id: "requests", icon: FileText, label: "Yêu cầu", path: "/barista/requests" },
    { id: "profile", icon: User, label: "Hồ sơ cá nhân", path: "/barista/profile" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Pha chế</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block md:relative absolute top-16 md:top-0 left-0 right-0 md:right-auto w-full md:w-64 bg-card border-r border-border flex flex-col z-30 md:z-auto`}
      >
        <div className="hidden md:block p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Pha chế</p>
        </div>

        <nav className="flex-1 p-4 overflow-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                  currentPage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm md:text-base">{item.label}</span>
              </button>
            );
          })}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 text-red-600 hover:bg-red-100">
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm md:text-base">Đăng xuất</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Đăng xuất
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
