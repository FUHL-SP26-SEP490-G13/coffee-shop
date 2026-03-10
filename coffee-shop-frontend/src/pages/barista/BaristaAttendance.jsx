import { useState } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export function BaristaAttendance() {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime] = useState('08:05');

  const handleCheckIn = () => {
    toast.success('Checked in successfully!');
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    toast.success('Checked out successfully!');
    setIsCheckedIn(false);
  };

  const getWorkDuration = () => {
    const now = new Date();
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const checkIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    const diff = now.getTime() - checkIn.getTime();
    const hoursWorked = Math.floor(diff / (1000 * 60 * 60));
    const minutesWorked = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursWorked}h ${minutesWorked}m`;
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Attendance</h1>

        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl font-semibold mb-2">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="flex gap-3 mb-6">
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
              <div className="text-center space-y-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                  Currently Checked In
                </Badge>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Check In: {checkInTime}</span>
                  </div>
                  <span>•</span>
                  <span>Duration: {getWorkDuration()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {[
              { date: '2026-02-06', checkIn: '08:05', checkOut: '16:00', status: 'late' },
              { date: '2026-02-05', checkIn: '08:00', checkOut: '16:05', status: 'present' },
              { date: '2026-02-04', checkIn: '08:00', checkOut: '16:00', status: 'present' },
            ].map((record, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>In: {record.checkIn}</span>
                        <span>•</span>
                        <span>Out: {record.checkOut}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'secondary'
                          : record.status === 'late'
                          ? 'outline'
                          : 'destructive'
                      }
                      className={
                        record.status === 'present'
                          ? 'bg-green-500/10 text-green-700 border-transparent'
                          : record.status === 'late'
                          ? 'bg-yellow-500/10 text-yellow-700 border-transparent'
                          : ''
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
