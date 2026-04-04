import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutGrid,
  ChefHat,
  Users,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  ArrowLeftRight,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ShoppingBag,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
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
} from '../../components/ui/alert-dialog';
import authenticationService from '../../services/authenticationService';
import notificationService from '@/services/notificationService';
import socket from '@/lib/socket';
import { getNotificationLink } from '@/utils/getNotificationLink';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Logo from '/logo/Logo.png';

const STAFF_SIDEBAR_PREF_KEY = 'staff_sidebar_collapsed_by_page';
const STAFF_SIDEBAR_DEFAULTS = {
  pos: true,
};

export function StaffApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsedByPage, setSidebarCollapsedByPage] = useState(() => {
    try {
      const raw = localStorage.getItem(STAFF_SIDEBAR_PREF_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

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

  const unreadCount = notifications.filter(
    (item) => Number(item.is_read) === 0,
  ).length;

  const handleLogout = async () => {
    await authenticationService.logout();
    window.location.href = '/';
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('orders/pending')) return 'orders-pending';
    if (path.includes('orders/preparing')) return 'orders-preparing';
    if (path.includes('orders/completed')) return 'orders-completed';
    if (path.includes('orders/cancelled')) return 'orders-cancelled';
    if (path.includes('takeaway')) return 'takeaway'; 
    if(path.includes('orders')) return 'orders';
    if (path.includes('kitchen')) return 'kitchen';
    if (path.includes('tables')) return 'tables';
    if (path.includes('attendance')) return 'attendance';
    if (path.includes('schedule')) return 'schedule';
    if (path.includes('inventory')) return 'inventory';
    if (path.includes('requests')) return 'requests';
    if (path.includes('profile')) return 'profile';
    if (path.includes('pos')) return 'pos';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const defaultCollapsedForPage =
    STAFF_SIDEBAR_DEFAULTS[currentPage] ?? false;
  const isSidebarCollapsed =
    sidebarCollapsedByPage[currentPage] ?? defaultCollapsedForPage;
  const isSidebarExpanded = !isSidebarCollapsed || isSidebarHovered;
  const isSidebarCompact = !isSidebarExpanded;

  const menuGroups = [
    {
      title: 'Bán Hàng & Phục Vụ',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', path: '/staff/dashboard' },
        { id: 'tables', icon: Users, label: 'Phòng bàn', path: '/staff/tables' },
        { id: 'takeaway', icon: ShoppingBag, label: 'Đặt mang đi', path: '/staff/takeaway' },
        { id: 'orders-pending', icon: ShoppingBag, label: 'Đơn Đang chờ', path: '/staff/orders/pending' },
        { id: 'orders-preparing', icon: ShoppingBag, label: 'Đơn Đang chuẩn bị', path: '/staff/orders/preparing' },
        { id: 'orders-completed', icon: ShoppingBag, label: 'Đơn Hoàn thành', path: '/staff/orders/completed' },
        { id: 'orders-cancelled', icon: ShoppingBag, label: 'Đơn Đã hủy', path: '/staff/orders/cancelled' },
        { id: 'kitchen', icon: ChefHat, label: 'Bếp', path: '/staff/kitchen' },

      ],
    },
    {
      title: 'Vận Hành',
      items: [
        { id: 'inventory', icon: ClipboardList, label: 'Kho hàng', path: '/staff/inventory' },
        { id: 'requests', icon: ArrowLeftRight, label: 'Đổi ca', path: '/staff/requests' },
      ],
    },
    {
      title: 'Cá Nhân',
      items: [
        { id: 'attendance', icon: Clock, label: 'Điểm danh ca làm', path: '/staff/attendance' },
        { id: 'schedule', icon: Calendar, label: 'Lịch làm việc', path: '/staff/schedule' },
        { id: 'profile', icon: User, label: 'Thông tin cá nhân', path: '/staff/profile' },
      ],
    },
  ];

  useEffect(() => {
    try {
      localStorage.setItem(
        STAFF_SIDEBAR_PREF_KEY,
        JSON.stringify(sidebarCollapsedByPage),
      );
    } catch {
      // Ignore localStorage errors to avoid blocking UI interactions.
    }
  }, [sidebarCollapsedByPage]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const profileRes = await authenticationService.getProfile();
        const user = profileRes?.data?.id
          ? profileRes.data
          : profileRes?.data?.data || profileRes?.data || null;

        if (user?.id) {
          if (!socket.connected) {
            socket.connect();
          }

          socket.emit('join-user-room', user.id);
          console.log('Staff joined room:', `user-${user.id}`);
        } else {
          console.log('Không tìm thấy user.id');
        }

        const notificationRes = await notificationService.getMine();
        const notificationList = Array.isArray(notificationRes?.data)
          ? notificationRes.data
          : Array.isArray(notificationRes?.data?.data)
            ? notificationRes.data.data
            : Array.isArray(notificationRes)
              ? notificationRes
              : [];
        setNotifications(notificationList);
      } catch (error) {
        console.error('Init staff notifications error:', error);
      }
    };

    initNotifications();

    const handleNewNotification = (data) => {
      console.log('received staff notification:', data);

      setNotifications((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const uniqueKey = data.recipient_id || `${data.id}-${data.user_id}`;
        const existed = list.some(
          (item) => (item.recipient_id || `${item.id}-${item.user_id}`) === uniqueKey,
        );

        if (existed) return list;

        return [{ ...data, is_read: 0 }, ...list];
      });
    };

    socket.on('staff:notification', handleNewNotification);

    return () => {
      socket.off('staff:notification', handleNewNotification);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleReadNotification = async (item) => {
    try {
      if (Number(item.is_read) === 0 && item.recipient_id) {
        await notificationService.markAsRead(item.recipient_id);
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.recipient_id === item.recipient_id ? { ...n, is_read: 1 } : n,
        ),
      );

      setShowNotifications(false);

      const targetLink = getNotificationLink(item);
      navigate(targetLink);
    } catch (error) {
      console.error('Read staff notification error:', error);
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
              : n,
          ),
        );
      } else {
        await notificationService.markAsUnread(item.recipient_id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.recipient_id === item.recipient_id
              ? { ...n, is_read: 0, read_at: null }
              : n,
          ),
        );
      }
    } catch (error) {
      console.error('Toggle staff notification error:', error);
    }
  };

  const toggleAllReadStatus = async () => {
    try {
      const hasUnread = notifications.some(
        (item) => Number(item.is_read) === 0,
      );

      if (hasUnread) {
        await notificationService.markAllAsRead();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 1,
            read_at: new Date().toISOString(),
          })),
        );
      } else {
        await notificationService.markAllAsUnread();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 0,
            read_at: null,
          })),
        );
      }
    } catch (error) {
      console.error('Toggle all staff notifications error:', error);
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
    <div className='flex h-screen w-full bg-background overflow-hidden relative'>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className='md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg dark:shadow-none'
      >
        {mobileMenuOpen ? (
          <X className='w-5 h-5' />
        ) : (
          <Menu className='w-5 h-5' />
        )}
      </button>

      {mobileMenuOpen && (
        <div
          className='md:hidden fixed inset-0 bg-black/50 z-30'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 ${isSidebarCompact ? 'md:w-20' : 'md:w-64'} bg-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div
          className={`p-6 border-b border-border ${isSidebarCompact ? 'md:px-3' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <button
            type='button'
            onClick={toggleSidebar}
            className='hidden md:inline-flex absolute top-3 right-3 items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors'
            aria-label={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className='w-4 h-4' />
            ) : (
              <ChevronLeft className='w-4 h-4' />
            )}
          </button>
          <img
            src={Logo}
            alt='Coffee Shop Logo'
            className={`w-auto ${isSidebarCompact ? 'h-12' : 'h-20'}`}
          />
          <p className={`text-sm text-muted-foreground mt-1 ${isSidebarCompact ? 'md:hidden' : ''}`}>
            Cổng Nhân viên
          </p>
        </div>

        <TooltipProvider>
          <nav className='flex-1 p-4 overflow-auto'>
            {menuGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className={`px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ${isSidebarCompact ? 'md:hidden' : ''}`}>
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
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mb-1 ${isSidebarCompact ? 'md:justify-center md:px-2' : ''} ${
                        currentPage === item.id
                          ? 'bg-primary text-primary-foreground shadow-sm dark:shadow-none'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      title={isSidebarCompact ? item.label : undefined}
                    >
                      <Icon className='w-[18px] h-[18px] flex-shrink-0' />
                      <span className={`text-sm font-medium ${isSidebarCompact ? 'md:hidden' : ''}`}>
                        {item.label}
                      </span>
                    </button>
                  );

                  if (!isSidebarCompact) {
                    return menuButton;
                  }

                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                      <TooltipContent side='right' sideOffset={10}>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground ${isSidebarCompact ? 'md:justify-center md:px-2' : ''}`}
                  title={isSidebarCompact ? 'Đăng xuất' : undefined}
                >
                  <LogOut className='w-5 h-5 flex-shrink-0' />
                  <span className={`text-sm ${isSidebarCompact ? 'md:hidden' : ''}`}>
                    Đăng xuất
                  </span>
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
        </TooltipProvider>
      </div>

      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background">
        <div
          ref={notificationRef}
          className='flex-shrink-0 flex justify-end items-center gap-3 px-4 md:px-8 pt-4 md:pt-4 pb-0 relative'
        >
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border bg-card text-foreground hover:bg-accent shadow-sm dark:shadow-none transition"
            title="Đổi giao diện Sáng/Tối"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
             onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-full border bg-card text-foreground hover:bg-accent shadow-sm dark:shadow-none"
          >
            <Bell className='w-5 h-5' />
            {unreadCount > 0 && (
              <span className='absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center'>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className='absolute top-14 right-4 md:right-8 w-[360px] bg-card text-card-foreground border border-border rounded-xl shadow-xl dark:shadow-none z-50 overflow-hidden'>
              <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
                <h3 className='font-semibold'>Thông báo</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={toggleAllReadStatus}
                    className='text-sm text-primary hover:underline'
                  >
                    {notifications.some((item) => Number(item.is_read) === 0)
                      ? 'Đánh dấu tất cả đã đọc'
                      : 'Đánh dấu tất cả chưa đọc'}
                  </button>
                )}
              </div>

              <div className='max-h-96 overflow-y-auto'>
                {notifications.length === 0 ? (
                  <div className='p-4 text-sm text-muted-foreground'>
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
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1'>
                          <p className='font-medium text-sm'>{item.title}</p>
                          <p className='text-sm text-muted-foreground'>
                            {item.message}
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>

                        <div className='flex flex-col items-end gap-2 shrink-0'>
                          {Number(item.is_read) === 0 && (
                            <span className='w-2 h-2 rounded-full bg-red-500 mt-1' />
                          )}

                          <button
                            onClick={(e) => handleToggleRead(item, e)}
                            className='text-xs text-primary hover:underline'
                          >
                            {Number(item.is_read) === 0 ? 'Đã đọc' : 'Chưa đọc'}
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

        <div className={`flex-1 w-full p-4 md:p-8 pt-2 md:pt-2 ${currentPage === 'pos' ? 'overflow-hidden flex flex-col p-2 md:p-2' : 'overflow-y-auto'}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
