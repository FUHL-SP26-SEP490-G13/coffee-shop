import { useState } from "react";
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
} from "lucide-react";
import { AdminOverview } from "./AdminOverview";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";
import { AdminUsers } from "./AdminUsers";
import { AdminStaffSchedule } from "./AdminStaffSchedule";
import { AdminInventory } from "./AdminInventory";
import { AdminVouchers } from "./AdminVouchers";
import { UserProfile } from "../common/UserProfile";
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

export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authenticationService.logout();
    window.location.href = "/login";
  };

  const menuItems = [
    { id: "overview", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { id: "products", icon: Package, label: "Sản phẩm" },
    { id: "orders", icon: ShoppingBag, label: "Đơn hàng" },
    { id: "users", icon: Users, label: "Người dùng" },
    { id: "schedule", icon: Calendar, label: "Lịch làm việc nhân viên" },
    { id: "inventory", icon: ClipboardList, label: "Kho hàng" },
    { id: "vouchers", icon: Tag, label: "Vouchers" },
    {id: "profile", icon: User, label: "Thông tin cá nhân"},
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card border-b border-border p-4 sticky top-0 z-40">
        <div>
          <h1 className="text-lg font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Quản lý</p>
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

      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block md:relative absolute top-16 md:top-0 left-0 right-0 md:right-auto w-full md:w-64 bg-card border-r border-border flex flex-col z-30 md:z-auto`}
      >
        <div className="hidden md:block mb-8 p-4">
          <h1 className="text-2xl font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Quản lý</p>
        </div>

        <nav className="space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mt-4 text-red-600 hover:bg-red-100">
                <LogOut className="w-4 h-4 flex-shrink-0" />
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentPage === "overview" && <AdminOverview />}
        {currentPage === "products" && <AdminProducts />}
        {currentPage === "orders" && <AdminOrders />}
        {currentPage === "users" && <AdminUsers />}
        {currentPage === "schedule" && <AdminStaffSchedule />}
        {currentPage === "inventory" && <AdminInventory />}
        {currentPage === "vouchers" && <AdminVouchers />}
        {currentPage === "profile" && <UserProfile />}
      </div>
    </div>
  );
}
