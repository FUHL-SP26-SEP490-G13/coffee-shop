import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
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
  ImagePlus,
  ListOrdered,
  Coffee,
  PlusCircle,
  ChevronDown,
  Menu,
  X,
  LayoutGrid,
  Bell,
  MessageSquare,
  Shield,
  Coins,
  Zap,
  Clock,
  Moon,
  Sun,
  Mailbox,
  FileText,
  UserCheck,
  Settings2,
  MapPin,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import notificationService from "@/services/notificationService";
import socket from "@/lib/socket";
import { getNotificationLink } from "@/utils/getNotificationLink";
import receiptSettingService from "@/services/receiptSettingService";

export default function AdminApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(
    () =>
      location.pathname.includes("/admin/menu") ||
      location.pathname.includes("/admin/toppings")
  );
  const [openScheduleMenu, setOpenScheduleMenu] = useState(
    () =>
      location.pathname.includes("/admin/schedule/templates") ||
      location.pathname.includes("/admin/schedule/list")
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (
      location.pathname.includes("/admin/menu") ||
      location.pathname.includes("/admin/toppings")
    )
      setOpenMenu(true);
    if (
      location.pathname.includes("/admin/schedule/templates") ||
      location.pathname.includes("/admin/schedule/list")
    )
      setOpenScheduleMenu(true);
  }, [location.pathname]);

  useEffect(() => {
    const routeTitles = {
      "/admin/dashboard": "Bảng điều khiển",
      "/admin/end-of-day-report": "Báo cáo tổng kết",
      "/admin/shift-report": "Báo cáo ca làm",
      "/admin/orders": "Đơn hàng",
      "/admin/tables": "Quản lý bàn",
      "/admin/menu/categories": "Danh mục",
      "/admin/menu/products": "Sản phẩm",
      "/admin/toppings": "Topping",
      "/admin/ingredients": "Nguyên liệu",
      "/admin/users": "Người dùng",
      "/admin/reviews": "Đánh giá",
      "/admin/discounts": "Mã giảm giá",
      "/admin/reputation": "Điểm uy tín",
      "/admin/loyalty": "Điểm loyalty",
      "/admin/flash-sales": "Flash sale",
      "/admin/banners": "Quảng cáo",
      "/admin/news-list": "Bài viết",

      "/admin/schedule/templates": "Quản lý ca làm",
      "/admin/schedule/list": "Lịch làm việc",
      "/admin/attendance": "Điểm danh nhân viên",

      "/admin/receipt-settings": "Tùy chỉnh",
      "/admin/profile": "Thông tin cá nhân",
    };

    let matchedTitle = "Quản trị viên";
    if (routeTitles[location.pathname]) {
      matchedTitle = routeTitles[location.pathname];
    } else {
      const match = Object.keys(routeTitles).find((path) =>
        location.pathname.startsWith(path)
      );
      if (match) matchedTitle = routeTitles[match];
    }

    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = `${matchedTitle} | ${shopName}`;
  }, [location.pathname]);

  const [storeLogo, setStoreLogo] = useState(() => {
    return localStorage.getItem("cached_store_logo") || Logo;
  });

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data && data.logo_url) {
          setStoreLogo(data.logo_url);
          localStorage.setItem("cached_store_logo", data.logo_url);
        } else {
          setStoreLogo(Logo);
          localStorage.removeItem("cached_store_logo");
        }
      } catch (error) {
        setStoreLogo(Logo);
        localStorage.removeItem("cached_store_logo");
      }
    };
    fetchLogo();

    const handleReceiptUpdate = () => {
      fetchLogo();
    };

    window.addEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    return () => {
      window.removeEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    };
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const unreadCount = notifications.filter(
    (item) => Number(item.is_read) === 0
  ).length;

  const handleLogout = () => {
    authenticationService.logout();
    navigate("/");
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
          fixed md:sticky top-0 left-0 z-40
          h-screen w-64 bg-card border-r border-border flex flex-col
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
          <img
            src={storeLogo}
            onError={(e) => {
              e.currentTarget.src = Logo;
            }}
            alt="Coffee Shop Logo"
            className="h-20 w-auto object-contain rounded-2xl animate-pulse cursor-pointer hover:scale-105 transition-transform"
          />
          <p className="text-sm text-muted-foreground">Cổng Quản lý</p>
        </div>

        <nav className="p-4 overflow-y-auto flex-1 pb-24 custom-scrollbar">
          <div className="space-y-6">
            {/* ================= TỔNG QUAN ================= */}
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Tổng quan
              </p>
              <div className="space-y-1">
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
                  <span className="text-sm tracking-wide">Bảng điều khiển</span>
                </NavLink>
                <NavLink
                  to="/admin/end-of-day-report"
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm tracking-wide">
                    Báo cáo tổng kết
                  </span>
                </NavLink>
                <NavLink
                  to="/admin/shift-report"
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Báo cáo ca làm</span>
                </NavLink>
              </div>
            </div>

            {/* ================= BÁN HÀNG & PHỤC VỤ ================= */}
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                Bán hàng & Phục vụ
              </p>
              <div className="space-y-1">
                <NavLink
                  to="/admin/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Đơn hàng</span>
                </NavLink>
                <NavLink
                  to="/admin/tables"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Quản lý bàn</span>
                </NavLink>
              </div>
            </div>

            {/* ================= SẢN PHẨM & KHO ================= */}
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                Sản phẩm & Kho
              </p>
              <div className="space-y-1">
                <div>
                  <button
                    onClick={() => setOpenMenu(!openMenu)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname.includes("/admin/menu") ||
                      location.pathname.includes("/admin/toppings")
                        ? "text-primary font-bold bg-primary/5"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-sm tracking-wide flex-1 text-left">
                      Thực đơn
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openMenu
                        ? "grid-rows-[1fr] opacity-100 mt-1"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-6 space-y-1 flex flex-col">
                        <NavLink
                          to="/admin/menu/categories"
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-xs tracking-wide ${
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
                            `flex items-center gap-2 px-3 py-2 rounded-md text-xs tracking-wide ${
                              isActive
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-secondary"
                            }`
                          }
                        >
                          <Coffee className="w-4 h-4" />
                          Sản phẩm
                        </NavLink>
                        <NavLink
                          to="/admin/toppings"
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-xs tracking-wide ${
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
                    </div>
                  </div>
                </div>

                <NavLink
                  to="/admin/ingredients"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Nguyên liệu</span>
                </NavLink>
              </div>
            </div>

            {/* ================= KHÁCH HÀNG & MARKETING ================= */}
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                Khách hàng & Marketing
              </p>
              <div className="space-y-1">
                <NavLink
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Người dùng</span>
                </NavLink>
                <NavLink
                  to="/admin/reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Đánh giá</span>
                </NavLink>
                <NavLink
                  to="/admin/discounts"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Mã giảm giá</span>
                </NavLink>
                <NavLink
                  to="/admin/reputation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Điểm uy tín</span>
                </NavLink>
                <NavLink
                  to="/admin/loyalty"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Điểm loyalty</span>
                </NavLink>
                <NavLink
                  to="/admin/flash-sales"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm tracking-wide">Flash sale</span>
                </NavLink>
                <NavLink
                  to="/admin/banners"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Quảng cáo</span>
                </NavLink>
                <NavLink
                  to="/admin/news-list"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Bài viết</span>
                </NavLink>
              </div>
            </div>

            {/* ================= NHÂN SỰ & HỆ THỐNG ================= */}
            <div>
              <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
                Hệ thống
              </p>
              <div className="space-y-1">
                <div>
                  <button
                    onClick={() => setOpenScheduleMenu(!openScheduleMenu)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname.includes("/admin/schedule/templates") ||
                      location.pathname.includes("/admin/schedule/list")
                        ? "text-primary font-bold bg-primary/5"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm tracking-wide flex-1 text-left">
                      Lịch làm việc
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openScheduleMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openScheduleMenu
                        ? "grid-rows-[1fr] opacity-100 mt-1"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-6 space-y-1 flex flex-col">
                        <NavLink
                          to="/admin/schedule/templates"
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-xs tracking-wide ${
                              isActive
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-secondary"
                            }`
                          }
                        >
                          <Clock className="w-4 h-4" />
                          Quản lý ca làm
                        </NavLink>
                        <NavLink
                          to="/admin/schedule/list"
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-md text-xs tracking-wide ${
                              isActive
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-secondary"
                            }`
                          }
                        >
                          <Calendar className="w-4 h-4" />
                          Lịch làm việc
                        </NavLink>
                      </div>
                    </div>
                  </div>
                </div>
                <NavLink
                  to="/admin/attendance"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-sm tracking-wide">
                    Điểm danh nhân viên
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/receipt-settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="text-sm tracking-wide">
                    Tùy chỉnh
                  </span>
                </NavLink>
                <NavLink
                  to="/admin/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-secondary"
                    }`
                  }
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm tracking-wide">
                    Thông tin cá nhân
                  </span>
                </NavLink>
              </div>
            </div>
          </div>

          <div className="mt-8 mb-4 border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-primary hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-bold tracking-wide">
                    Đăng xuất
                  </span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                <div className="bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-orange-950/40 dark:to-amber-900/20 px-6 py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-4 ring-8 ring-primary/5 dark:ring-primary/10">
                    <LogOut className="h-8 w-8 text-primary translate-x-0.5" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Đăng xuất hệ thống
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                    Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại và
                    đăng xuất không?
                  </AlertDialogDescription>
                </div>
                <div className="px-6 py-4 bg-background dark:bg-card border-t border-border/50">
                  <AlertDialogFooter className="flex flex-row gap-3 w-full sm:justify-between">
                    <AlertDialogCancel className="mt-0 flex-1 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700 transition-colors">
                      Hủy bỏ
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="flex-1 rounded-xl bg-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/30 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] transition-all"
                    >
                      Xác nhận đăng xuất
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full md:w-auto overflow-y-auto">
        {/* Topbar notification */}
        <div
          ref={notificationRef}
          className="flex justify-end gap-3 px-4 md:px-8 pt-4 md:pt-4 pb-0 relative"
        >
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors text-gray-700 dark:text-gray-200"
            title="Bật/Tắt giao diện tối"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors text-gray-700 dark:text-gray-200"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                style={{ top: "100%", marginRight: "-0.5rem" }}
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Thông báo
                  </h3>
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
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={
                          item.recipient_id || `${item.id}-${item.created_at}`
                        }
                        onClick={() => handleReadNotification(item)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          Number(item.is_read) === 0
                            ? "bg-orange-50 dark:bg-amber-900/20"
                            : "bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.created_at).toLocaleString(
                                "vi-VN"
                              )}
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
                              {Number(item.is_read) === 0
                                ? "Đã đọc"
                                : "Chưa đọc"}
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
        </div>

        <div className="p-4 md:px-8 md:pb-8 pt-2 md:pt-2">
          <style>{`
            @keyframes adminPageFadeUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .admin-page-transition {
              animation: adminPageFadeUp 320ms ease-out forwards;
            }
          `}</style>
          <div key={location.pathname} className="admin-page-transition">
            <Outlet context={{ notifications }} />
          </div>
        </div>
      </div>
    </div>
  );
}
