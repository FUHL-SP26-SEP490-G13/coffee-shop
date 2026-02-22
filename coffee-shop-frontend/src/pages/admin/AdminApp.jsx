import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Calendar,
  ClipboardList,
  User,
  Tag,
  LogOut,
  Menu,
  X,
  Mail,
  ImagePlus,
  AlignCenter,
  LucideAlignCenter,
  AlignRight,
} from "lucide-react";
import { useState } from "react";
import authenticationService from "../../services/authenticationService";
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
import Logo from "/logo/Logo.png";

export default function AdminApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authenticationService.logout();
    navigate("/");
  };

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { path: "/admin/products", icon: Package, label: "Sản phẩm" },
    { path: "/admin/orders", icon: ShoppingBag, label: "Đơn hàng" },
    { path: "/admin/users", icon: Users, label: "Người dùng" },
    { path: "/admin/schedule", icon: Calendar, label: "Lịch làm việc" },
    { path: "/admin/inventory", icon: ClipboardList, label: "Kho hàng" },
    { path: "/admin/discounts", icon: Tag, label: "Mã giảm giá" },
    { path: "/admin/news-list", icon: ClipboardList, label: "Quản lý bài viết" },
    { path: "/admin/newsletter", icon: Mail, label: "Email đăng kí" },
    { path: "/admin/banners", icon: ImagePlus, label: "Quản lý Banner" },
    { path: "/admin/profile", icon: User, label: "Thông tin cá nhân" },
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

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={Logo} alt="Coffee Shop Logo" className="h-20 w-auto" />
          <p className="text-sm text-muted-foreground">Cổng Quản lý</p>
        </div>

        <nav className="space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-secondary"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 mt-4 text-red-600 hover:bg-red-100 rounded-lg">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Đăng xuất</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc muốn đăng xuất?
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

      {/* Main content */}
      <div className="flex-1 w-full md:w-auto overflow-y-auto">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
