import { useState } from 'react';
import { LayoutGrid, ChefHat, Users, Calendar, Clock, ClipboardList, FileText, User, LogOut } from 'lucide-react';
import { StaffPOS } from './StaffPOS';
import { StaffKitchen } from './StaffKitchen';
import { StaffTables } from './StaffTables';
import { StaffAttendance } from './StaffAttendance';
import { StaffSchedule } from './StaffSchedule';
import { StaffInventory } from './StaffInventory';
import { StaffRequests } from './StaffRequests';
import { StaffProfile } from './StaffProfile';
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

  const handleLogout = async () => {
    await authenticationService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Staff Portal</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-auto">
          <button
            onClick={() => setCurrentPage('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'pos'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>POS</span>
          </button>
          <button
            onClick={() => setCurrentPage('kitchen')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'kitchen'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <ChefHat className="w-5 h-5" />
            <span>Kitchen</span>
          </button>
          <button
            onClick={() => setCurrentPage('tables')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'tables'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Tables</span>
          </button>
          <button
            onClick={() => setCurrentPage('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'attendance'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setCurrentPage('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'schedule'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => setCurrentPage('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'inventory'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Stock</span>
          </button>
          <button
            onClick={() => setCurrentPage('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'requests'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Requests</span>
          </button>
          <button
            onClick={() => setCurrentPage('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of the system?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
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
        {currentPage === 'profile' && <StaffProfile />}
      </div>
    </div>
  );
}
