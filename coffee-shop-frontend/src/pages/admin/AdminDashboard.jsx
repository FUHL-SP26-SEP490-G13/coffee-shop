import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  Tag,
  LogOut
} from 'lucide-react';
import { AdminOverview } from './AdminOverview';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminUsers } from './AdminUsers';
import { AdminStaffSchedule } from './AdminStaffSchedule';
import { AdminInventory } from './AdminInventory';
import { AdminVouchers } from './AdminVouchers';
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

export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('overview');

  const handleLogout = () => {
    authenticationService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="mb-8">
          <h1 className="text-xl mb-1">Coffee Admin</h1>
          <p className="text-xs text-muted-foreground">Management Dashboard</p>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setCurrentPage('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentPage('products')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'products'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-sm">Products</span>
          </button>
          <button
            onClick={() => setCurrentPage('orders')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'orders'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Orders</span>
          </button>
          <button
            onClick={() => setCurrentPage('users')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Users</span>
          </button>
          <button
            onClick={() => setCurrentPage('schedule')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'schedule'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Staff Schedule</span>
          </button>
          <button
            onClick={() => setCurrentPage('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'inventory'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">Inventory</span>
          </button>
          <button
            onClick={() => setCurrentPage('vouchers')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'vouchers'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="text-sm">Vouchers</span>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mt-4 text-red-600 hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Log Out</span>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentPage === 'overview' && <AdminOverview />}
        {currentPage === 'products' && <AdminProducts />}
        {currentPage === 'orders' && <AdminOrders />}
        {currentPage === 'users' && <AdminUsers />}
        {currentPage === 'schedule' && <AdminStaffSchedule />}
        {currentPage === 'inventory' && <AdminInventory />}
        {currentPage === 'vouchers' && <AdminVouchers />}
      </div>
    </div>
  );
}
