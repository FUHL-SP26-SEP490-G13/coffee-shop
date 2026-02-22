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
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="p-6 border-b border-border">
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
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 text-red-600 hover:bg-red-100">
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Đăng xuất</span>
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
      <div className="flex-1 w-full md:w-auto overflow-auto">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
