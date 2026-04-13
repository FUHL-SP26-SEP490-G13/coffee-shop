import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  PackageOpen,
  Calendar,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
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
import notificationService from "@/services/notificationService";
import socket from "@/lib/socket";
import { getNotificationLink } from "@/utils/getNotificationLink";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "/logo/Logo.png";
import receiptSettingService from "@/services/receiptSettingService";

const BARISTA_SIDEBAR_PREF_KEY = "barista_sidebar_collapsed_by_page";
const BARISTA_SIDEBAR_DEFAULTS = {};

export function BaristaApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsedByPage, setSidebarCollapsedByPage] = useState(() => {
    try {
      const raw = localStorage.getItem(BARISTA_SIDEBAR_PREF_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

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

  // Quản lý Dark Mode thay cho force disable
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);

  useEffect(() => {
    const routeTitles = {
      "/barista/dashboard": "Bảng điều khiển",
      "/barista/orders": "Đơn hàng",
      "/barista/attendance": "Chấm công",
      "/barista/schedule": "Lịch làm việc",
      "/barista/profile": "Thông tin cá nhân"
    };

    let matchedTitle = "Cổng Pha chế";
    if (routeTitles[location.pathname]) {
      matchedTitle = routeTitles[location.pathname];
    } else {
      const match = Object.keys(routeTitles).find(path => location.pathname.startsWith(path));
      if (match) matchedTitle = routeTitles[match];
    }

    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = `${matchedTitle} | ${shopName}`;
  }, [location.pathname]);

  const unreadCount = notifications.filter(
    (item) => Number(item.is_read) === 0
  ).length;

  const handleLogout = () => {
    authenticationService.logout();
    window.location.href = "/";
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes("orders")) return "orders";
    if (path.includes("attendance")) return "attendance";
    if (path.includes("schedule")) return "schedule";
    if (path.includes("profile")) return "profile";
    return "dashboard";
  };

  const currentPage = getCurrentPage();
  const defaultCollapsedForPage = BARISTA_SIDEBAR_DEFAULTS[currentPage] ?? false;
  const isSidebarCollapsed =
    sidebarCollapsedByPage[currentPage] ?? defaultCollapsedForPage;
  const isSidebarExpanded = !isSidebarCollapsed || isSidebarHovered;
  const isSidebarCompact = !isSidebarExpanded;

  const menuGroups = [
    {
      title: "Pha chế",
      items: [
        {
          id: "dashboard",
          icon: LayoutDashboard,
          label: "Bảng điều khiển",
          path: "/barista",
        },
        // {
        //   id: "orders",
        //   icon: PackageOpen,
        //   label: "Đơn hàng",
        //   path: "/barista/orders",
        // },
      ],
    },
    {
      title: "Cá nhân",
      items: [
        {
          id: "attendance",
          icon: Clock,
          label: "Chấm công",
          path: "/barista/attendance",
        },
        {
          id: "schedule",
          icon: Calendar,
          label: "Lịch làm việc",
          path: "/barista/schedule",
        },
        {
          id: "profile",
          icon: User,
          label: "Hồ sơ cá nhân",
          path: "/barista/profile",
        },
      ],
    },
  ];

  useEffect(() => {
    try {
      localStorage.setItem(
        BARISTA_SIDEBAR_PREF_KEY,
        JSON.stringify(sidebarCollapsedByPage)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [sidebarCollapsedByPage]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const profileRes = await authenticationService.getProfile();
        const user = profileRes?.data || profileRes?.data?.data;

        if (user?.id) {
          if (!socket.connected) {
            socket.connect();
          }
          socket.emit("join-user-room", user.id);
        }

        const notificationRes = await notificationService.getMine();
        setNotifications(
          notificationRes?.data?.data || notificationRes?.data || []
        );
      } catch (error) {
        console.error("Init barista notifications error:", error);
      }
    };

    initNotifications();

    const handleNewNotification = (data) => {
      setNotifications((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const existed = list.some(
          (item) => item.recipient_id === data.recipient_id
        );
        if (existed) return list;
        return [{ ...data, is_read: 0 }, ...list];
      });
    };

    socket.on("barista:notification", handleNewNotification);
    return () => {
      socket.off("barista:notification", handleNewNotification);
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
      console.error("Read barista notification error:", error);
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
      console.error("Toggle barista notification error:", error);
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
      console.error("Toggle all barista notifications error:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsedByPage((prev) => {
      const currentValue = prev[currentPage] ?? defaultCollapsedForPage;
      return {
        ...prev,
        [currentPage]: !currentValue,
      };
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 ${isSidebarCompact ? "md:w-20" : "md:w-64"} bg-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div
          className={`p-6 border-b border-border ${isSidebarCompact ? "md:px-3" : ""}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <img src={storeLogo} onError={(e) => { e.currentTarget.src = Logo; }} alt="Coffee Shop Logo" className="h-20 w-auto object-contain rounded-2xl animate-pulse cursor-pointer hover:scale-105 transition-transform" />
          <p className="text-sm text-muted-foreground mt-1">Cổng Pha chế</p>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:inline-flex absolute top-3 right-3 items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
            title={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <TooltipProvider>
          <nav className="flex-1 p-4 overflow-auto">
            {menuGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3
                  className={`px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ${
                    isSidebarCompact ? "md:hidden" : ""
                  }`}
                >
                  {group.title}
                </h3>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const menuButton = (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mb-1 ${
                        isSidebarCompact ? "md:justify-center md:px-2" : ""
                      } ${
                        currentPage === item.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      title={isSidebarCompact ? item.label : undefined}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span className={`text-sm font-medium ${isSidebarCompact ? "md:hidden" : ""}`}>
                        {item.label}
                      </span>
                    </button>
                  );

                  if (!isSidebarCompact) return menuButton;
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}

                        <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 ${isSidebarCompact ? 'md:justify-center md:px-2' : ''}`}
                  title={isSidebarCompact ? 'Đăng xuất' : undefined}
                >
                  <LogOut className='w-5 h-5 flex-shrink-0' />
                  <span className={`font-semibold text-sm ${isSidebarCompact ? 'md:hidden' : ''}`}>
                    Đăng xuất
                  </span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                <div className="bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-orange-950/40 dark:to-amber-900/20 px-6 py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-4 ring-8 ring-primary/5 dark:ring-primary/10">
                    <LogOut className="h-8 w-8 text-primary translate-x-0.5" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Đăng xuất hệ thống</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                    Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại và đăng xuất không?
                  </AlertDialogDescription>
                </div>
                <div className="px-6 py-4 bg-background dark:bg-card border-t border-border/50">
                  <AlertDialogFooter className="flex flex-row gap-3 w-full sm:justify-between">
                    <AlertDialogCancel className="mt-0 flex-1 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700 transition-colors">Hủy bỏ</AlertDialogCancel>
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
          </nav>
        </TooltipProvider>
      </div>

      <div className="flex-1 w-full md:w-auto overflow-auto">
        <div
          ref={notificationRef}
          className="flex-shrink-0 flex justify-end items-center gap-3 px-4 md:px-8 pt-4 md:pt-4 pb-0 relative"
        >
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border bg-card text-foreground hover:bg-accent shadow-sm transition"
            title="Đổi giao diện Sáng/Tối"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-full border bg-card text-foreground hover:bg-accent shadow-sm"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-14 right-4 md:right-8 w-[360px] bg-card text-card-foreground border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
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
                      className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent ${
                        Number(item.is_read) === 0 ? "bg-accent/50 dark:bg-accent/20" : "bg-transparent"
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

          <div className="flex-1 w-full overflow-y-auto p-4 md:p-8 pt-2 md:pt-2">
            <style>{`
              @keyframes baristaPageFadeUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .barista-page-transition {
                animation: baristaPageFadeUp 320ms ease-out forwards;
              }
            `}</style>
            <div key={location.pathname} className="barista-page-transition h-full w-full">
              <Outlet />
            </div>
          </div>
      </div>
    </div>
  );
}
