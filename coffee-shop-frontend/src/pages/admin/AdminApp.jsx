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
  Bell,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import notificationService from "@/services/notificationService";
import socket from "@/lib/socket";
import { getNotificationLink } from "@/utils/getNotificationLink";

export default function AdminApp() {
   const [openMenu, setOpenMenu] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [notifications, setNotifications] = useState([]);
   const [showNotifications, setShowNotifications] = useState(false);
   const notificationRef = useRef(null);
   const navigate = useNavigate();

   const unreadCount = notifications.filter(
     (item) => Number(item.is_read) === 0
   ).length;

  const handleLogout = () => {
    authenticationService.logout();
    navigate('/');
  };

    useEffect(() => {
      const initNotifications = async () => {
        try {
          const profileRes = await authenticationService.getProfile();
          console.log("profileRes:", profileRes);

          const user = profileRes?.data || profileRes?.data;
          console.log("resolved user:", user);

          if (user?.id) {
            if (!socket.connected) {
              socket.connect();
            }

            socket.emit("join-user-room", user.id);
            console.log("emit join-user-room:", `user-${user.id}`);
          } else {
            console.log("Không tìm thấy user.id");
          }

          const notificationRes = await notificationService.getMine();
          setNotifications(
            notificationRes?.data?.data || notificationRes?.data || []
          );
        } catch (error) {
          console.error("Init notifications error:", error);
        }
      };

      initNotifications();

      const handleNewNotification = (data) => {
        console.log("received socket notification:", data);

        setNotifications((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const existed = list.some(
            (item) => item.recipient_id === data.recipient_id
          );
          if (existed) return list;

          return [{ ...data, is_read: 0 }, ...list];
        });
      };

      socket.on("admin:notification", handleNewNotification);

      return () => {
        socket.off("admin:notification", handleNewNotification);
      };
    }, []);

      useEffect(() => {
        const handleClickOutside = (event) => {
          if (
            notificationRef.current &&
            !notificationRef.current.contains(event.target)
          ) {
            setShowNotifications(false);
          }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

        const handleReadNotification = async (item) => {
          try {
            if (Number(item.is_read) === 0 && item.recipient_id) {
              await notificationService.markAsRead(item.recipient_id);
            }

            setNotifications((prev) =>
              prev.map((n) =>
                n.recipient_id === item.recipient_id ? { ...n, is_read: 1 } : n
              )
            );

            setShowNotifications(false);

            const targetLink = getNotificationLink(item);
            navigate(targetLink);
          } catch (error) {
            console.error("Read notification error:", error);
          }
        };

  const menuItems = [
    { path: "/admin/orders", icon: ShoppingBag, label: "Đơn hàng" },
    { path: "/admin/users", icon: Users, label: "Người dùng" },
    { path: "/admin/schedule", icon: Calendar, label: "Lịch làm việc" },
    { path: "/admin/inventory", icon: ClipboardList, label: "Kho hàng" },
    { path: "/admin/discounts", icon: Tag, label: "Mã giảm giá" },
    {
      path: "/admin/news-list",
      icon: ClipboardList,
      label: "Quản lý bài viết",
    },
    { path: "/admin/subscriber", icon: Mail, label: "Email đăng kí" },
    { path: "/admin/banners", icon: ImagePlus, label: "Quản lý quảng cáo" },
    { path: "/admin/tables", icon: LayoutGrid, label: "Quản lý bàn" },
    { path: "/admin/reviews", icon: MessageSquare, label: "Quản lý đánh giá" },
    {
      path: "/admin/receipt-settings",
      icon: ClipboardList,
      label: "Cấu hình hóa đơn",
    },
    { path: "/admin/profile", icon: User, label: "Thông tin cá nhân" },
  ];

  const handleToggleRead = async (item, e) => {
    e.stopPropagation();

    try {
      if (Number(item.is_read) === 0) {
        await notificationService.markAsRead(item.recipient_id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.recipient_id === item.recipient_id
              ? { ...n, is_read: 1, read_at: new Date().toISOString() }
              : n
          )
        );
      } else {
        await notificationService.markAsUnread(item.recipient_id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.recipient_id === item.recipient_id
              ? { ...n, is_read: 0, read_at: null }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Toggle read notification error:", error);
    }
  };

  const toggleAllReadStatus = async () => {
    try {
      const hasUnread = notifications.some(
        (item) => Number(item.is_read) === 0
      );

      if (hasUnread) {
        await notificationService.markAllAsRead();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 1,
            read_at: new Date().toISOString(),
          }))
        );
      } else {
        await notificationService.markAllAsUnread();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 0,
            read_at: null,
          }))
        );
      }
    } catch (error) {
      console.error("Toggle all read status error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
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
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div
          className="p-4"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary"
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
              <span className="text-sm flex-1 text-left">Thực đơn</span>

              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  openMenu ? "rotate-180" : ""
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
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
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
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
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
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
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
        {/* Topbar notification */}
        <div
          ref={notificationRef}
          className="flex justify-end px-4 md:px-8 pt-4 md:pt-4 pb-0 relative"
        >
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-full border bg-white hover:bg-gray-50 shadow-sm"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-14 right-4 md:right-8 w-[360px] bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold">Thông báo</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={toggleAllReadStatus}
                    className="text-sm text-primary hover:underline"
                  >
                    {notifications.some((item) => Number(item.is_read) === 0)
                      ? "Đánh dấu tất cả đã đọc"
                      : "Đánh dấu tất cả chưa đọc"}
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Chưa có thông báo nào
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.recipient_id || `${item.id}-${item.created_at}`}
                      onClick={() => handleReadNotification(item)}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                        Number(item.is_read) === 0 ? "bg-orange-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {Number(item.is_read) === 0 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                          )}

                          <button
                            onClick={(e) => handleToggleRead(item, e)}
                            className="text-xs text-primary hover:underline"
                          >
                            {Number(item.is_read) === 0 ? "Đã đọc" : "Chưa đọc"}
                          </button>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:px-8 md:pb-8 pt-2 md:pt-2">
          <Outlet />
        </div>
      </div>
    </div>
  );
}