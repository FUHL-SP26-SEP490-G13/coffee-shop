import { useState } from 'react';
import { Smartphone, Tablet, Monitor, Coffee } from 'lucide-react';
import { StaffApp } from './pages/staff/StaffApp';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { BaristaApp } from './pages/barista/BaristaApp';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [appMode, setAppMode] = useState('staff');

  return (
    <div className="min-h-screen bg-background">
      {/* App Switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-card p-2 rounded-xl shadow-lg border">
        <button
          onClick={() => setAppMode('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            appMode === 'staff'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Tablet className="w-4 h-4" />
          <span className="text-sm">Staff</span>
        </button>
        <button
          onClick={() => setAppMode('barista')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            appMode === 'barista'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-sm">Barista</span>
        </button>
        <button
          onClick={() => setAppMode('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            appMode === 'admin'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm">Admin</span>
        </button>
      </div>

      {/* App Content */}
      {appMode === 'staff' && <StaffApp />}
      {appMode === 'barista' && <BaristaApp />}
      {appMode === 'admin' && <AdminDashboard />}
      
      <Toaster />
    </div>
  );
}