import { shifts, users } from '../../lib/mockData';
import { Calendar } from '../../components/ui/calendar';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Clock } from 'lucide-react';

export function StaffSchedule() {
  const today = new Date('2026-02-06');
  const todayShifts = shifts.filter((s) => s.date === '2026-02-06');

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl mb-6">My Schedule</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Calendar mode="single" selected={today} className="rounded-xl border" />
        </div>

        <div>
          <h3 className="text-sm mb-3">Today's Shifts</h3>
          <div className="space-y-3">
            {todayShifts.map((shift) => {
              const staff = users.find((u) => u.id === shift.staffId);
              return (
                <Card key={shift.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm mb-1">{staff?.name}</div>
                      <Badge variant="secondary">{shift.role}</Badge>
                    </div>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {shift.startTime} - {shift.endTime}
                  </div>
                </Card>
              );
            })}
          </div>

          <h3 className="text-sm mb-3 mt-6">Upcoming Shifts</h3>
          <div className="space-y-3">
            {shifts.filter((s) => s.date === '2026-02-07' && s.staffId === '2').map((shift) => (
              <Card key={shift.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm mb-1">Tomorrow</div>
                    <Badge variant="secondary">{shift.role}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {shift.startTime} - {shift.endTime}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
