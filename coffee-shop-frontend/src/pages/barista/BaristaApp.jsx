import { useState } from 'react';
import { PackageOpen, Calendar, Clock, FileText, User } from 'lucide-react';
import { BaristaOrders } from './BaristaOrders';
import { BaristaSchedule } from './BaristaSchedule';
import { BaristaAttendance } from './BaristaAttendance';
import { BaristaRequests } from './BaristaRequests';
import { BaristaProfile } from './BaristaProfile';

export function BaristaApp() {
  const [currentPage, setCurrentPage] = useState('orders');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-primary">Coffee Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Barista Portal</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-auto">
          <button
            onClick={() => setCurrentPage('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              currentPage === 'orders'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <PackageOpen className="w-5 h-5" />
            <span>Orders</span>
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
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {currentPage === 'orders' && <BaristaOrders />}
        {currentPage === 'attendance' && <BaristaAttendance />}
        {currentPage === 'schedule' && <BaristaSchedule />}
        {currentPage === 'requests' && <BaristaRequests />}
        {currentPage === 'profile' && <BaristaProfile />}
      </div>
    </div>
  );
}
