import { useState } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  MapPin,
  Ticket,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import authenticationService from "@/services/authenticationService";

import CustomerHome from "./CustomerHome";
import CustomerOrders from "./CustomerOrders";
import CustomerCart from "./CustomerCart";
import CustomerAddresses from "./CustomerAddresses";
import CustomerDiscounts from "./CustomerDiscounts";
import { UserProfile } from "../common/UserProfile";

export function CustomerApp() {
  const [currentPage, setCurrentPage] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authenticationService.logout();
    window.location.href = "/";
  };

  const menuItems = [
    { id: "home", icon: Home, label: "Trang chủ" },
    { id: "orders", icon: Package, label: "Đơn hàng của tôi" },
    { id: "cart", icon: ShoppingCart, label: "Giỏ hàng" },
    { id: "addresses", icon: MapPin, label: "Địa chỉ" },
    { id: "vouchers", icon: Ticket, label: "Ưu đãi của tôi" },
    { id: "profile", icon: User, label: "Hồ sơ cá nhân" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <div className="md:hidden flex items-center justify-between bg-card p-4 border-b">
        <h1 className="font-semibold text-primary">Cổng khách hàng</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-card border-r`}
      >
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Xin chào 👋</h2>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${
                  currentPage === item.id
                    ? "bg-primary text-white"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full mt-4 text-red-600">
                <LogOut className="inline mr-2" />
                Đăng xuất
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn đăng xuất?
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

      <div className="flex-1 p-6 overflow-auto">
        {currentPage === "home" && <CustomerHome />}
        {currentPage === "orders" && <CustomerOrders />}
        {currentPage === "cart" && <CustomerCart />}
        {currentPage === "addresses" && <CustomerAddresses />}
        {currentPage === "discounts" && <CustomerDiscounts />}
        {currentPage === "profile" && <UserProfile />}
      </div>
    </div>
  );
}
