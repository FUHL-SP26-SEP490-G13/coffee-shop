import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  Mail,
  ImagePlus,
  ListOrdered,
  Coffee,
  PlusCircle,
  ChevronDown,
  Menu,
  X,
  MapPin,
  LayoutGrid,
} from 'lucide-react';
import { useState } from 'react';
import authenticationService from '../../services/authenticationService';
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
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authenticationService.logout();
    navigate('/');
  };

  const menuItems = [
    { path: "/admin/orders", icon: ShoppingBag, label: "Đơn hàng" },
    { path: "/admin/users", icon: Users, label: "Người dùng" },
    { path: "/admin/schedule", icon: Calendar, label: "Lịch làm việc" },
    { path: "/admin/inventory", icon: ClipboardList, label: "Kho hàng" },
    { path: "/admin/discounts", icon: Tag, label: "Mã giảm giá" },
    { path: "/admin/news-list", icon: ClipboardList, label: "Quản lý bài viết" },
    { path: "/admin/newsletter", icon: Mail, label: "Email đăng kí" },
    { path: "/admin/banners", icon: ImagePlus, label: "Quản lý Banner" },
    { path: "/admin/area", icon: MapPin, label: "Quản lý khu vực" },
    { path: "/admin/tables", icon: LayoutGrid, label: "Quản lý bàn" },
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

          {/* ================= Dashboard ================= */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-secondary'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">Bảng điều khiển</span>
          </NavLink>

          {/* ================= Thực đơn ================= */}
          <div>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Package className="w-4 h-4" />
              <span className="text-sm flex-1 text-left">
                Thực đơn
              </span>

              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openMenu && (
              <div className="ml-6 mt-1 space-y-1">

                <NavLink
                  to="/admin/menu/categories"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`
                  }
                >
                  <ListOrdered className="w-4 h-4" />
                  Danh mục
                </NavLink>

                <NavLink
                  to="/admin/menu/products"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`
                  }
                >
                  <Coffee className="w-4 h-4" />
                  Sản phẩm
                </NavLink>

{/* khải edit here */}
                <NavLink
                  to="/admin/toppings"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`
                  }
                >
                  <PlusCircle className="w-4 h-4" />
                  Topping
                </NavLink>

              </div>
            )}
          </div>

          {/* ================= Các menu khác ================= */}
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
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}

          {/* ================= Logout ================= */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 mt-4 text-red-600 hover:bg-red-100 rounded-lg">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Đăng xuất</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Xác nhận đăng xuất
                </AlertDialogTitle>
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