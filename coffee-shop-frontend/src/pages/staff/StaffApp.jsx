import { useState } from 'react';
import { LayoutGrid, ChefHat, Users, Calendar, Clock, ClipboardList, FileText, User, LogOut, Menu, X } from 'lucide-react';
import { StaffPOS } from './StaffPOS';
import { StaffKitchen } from './StaffKitchen';
import { StaffTables } from './StaffTables';
import { StaffAttendance } from './StaffAttendance';
import { StaffSchedule } from './StaffSchedule';
import { StaffInventory } from './StaffInventory';
import { StaffRequests } from './StaffRequests';
import { UserProfile } from '../common/UserProfile';
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

export function StaffApp() {
  const [currentPage, setCurrentPage] = useState('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authenticationService.logout();
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'pos', icon: LayoutGrid, label: 'POS' },
    { id: 'kitchen', icon: ChefHat, label: 'Bếp' },
    { id: 'tables', icon: Users, label: 'Danh sách bàn' },
    { id: 'attendance', icon: Clock, label: 'Điểm danh ca làm' },
    { id: 'schedule', icon: Calendar, label: 'Lịch làm việc' },
    { id: 'inventory', icon: ClipboardList, label: 'Kho hàng' },
    { id: 'requests', icon: FileText, label: 'Yêu cầu' },
    { id: 'profile', icon: User, label: 'Thông tin cá nhân' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Nhân viên</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`${
        mobileMenuOpen ? 'block' : 'hidden'
      } md:block md:relative absolute top-16 md:top-0 left-0 right-0 md:right-auto w-full md:w-64 bg-card border-r border-border flex flex-col z-30 md:z-auto`}>
        <div className="hidden md:block p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Cổng Nhân viên</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                  currentPage === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm md:text-base">{item.label}</span>
              </button>
            );
          })}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
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
                <AlertDialogAction onClick={handleLogout}>Đăng xuất</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {currentPage === 'pos' && <StaffPOS />}
        {currentPage === 'kitchen' && <StaffKitchen />}
        {currentPage === 'tables' && <StaffTables />}
        {currentPage === 'attendance' && <StaffAttendance />}
        {currentPage === 'schedule' && <StaffSchedule />}
        {currentPage === 'inventory' && <StaffInventory />}
        {currentPage === 'requests' && <StaffRequests />}
        {currentPage === 'profile' && <UserProfile />}
      </div>
    </div>
  );
}
