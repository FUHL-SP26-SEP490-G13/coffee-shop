import { useState } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { attendance, users } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export function StaffAttendance() {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const currentStaff = users[1]; // Sarah Johnson
  const todayAttendance = attendance.filter((a) => a.date === '2026-02-06');

  const handleCheckIn = () => {
    toast.success('Checked in successfully!');
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    toast.success('Checked out successfully!');
    setIsCheckedIn(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl mb-6">Attendance</h2>

      {/* Check In/Out Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="flex gap-3">
          {!isCheckedIn ? (
            <Button onClick={handleCheckIn} className="flex-1 h-14">
              <LogIn className="w-5 h-5 mr-2" />
              Check In
            </Button>
          ) : (
            <Button onClick={handleCheckOut} variant="outline" className="flex-1 h-14">
              <LogOut className="w-5 h-5 mr-2" />
              Check Out
            </Button>
          )}
        </div>

        {isCheckedIn && (
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="bg-green-500/10 text-green-700">
              Currently Checked In • 5h 45m
            </Badge>
          </div>
        )}
      </Card>

      {/* Today's Attendance */}
      <div>
        <h3 className="text-sm mb-3">Today's Attendance</h3>
        <div className="space-y-3">
          {todayAttendance.map((record) => {
            const staff = users.find((u) => u.id === record.staffId);
            return (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      {staff?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm">{staff?.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>In: {record.checkIn}</span>
                        {record.checkOut && <span>Out: {record.checkOut}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      record.status === 'present'
                        ? 'bg-green-500/10 text-green-700'
                        : record.status === 'late'
                        ? 'bg-yellow-500/10 text-yellow-700'
                        : 'bg-red-500/10 text-red-700'
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
