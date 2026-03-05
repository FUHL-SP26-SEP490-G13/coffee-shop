import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export function BaristaSchedule() {
  const baristaShifts = [
    {
      id: '1',
      date: '2026-02-08',
      startTime: '08:00',
      endTime: '16:00',
      role: 'Barista',
    },
    {
      id: '2',
      date: '2026-02-09',
      startTime: '08:00',
      endTime: '16:00',
      role: 'Barista',
    },
    {
      id: '3',
      date: '2026-02-10',
      startTime: '14:00',
      endTime: '22:00',
      role: 'Barista',
    },
    {
      id: '4',
      date: '2026-02-11',
      startTime: '08:00',
      endTime: '16:00',
      role: 'Barista',
    },
    {
      id: '5',
      date: '2026-02-12',
      startTime: '08:00',
      endTime: '16:00',
      role: 'Barista',
    },
  ];

  const isToday = (dateString) => {
    const today = new Date('2026-02-08');
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const calculateDuration = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">My Schedule</h1>
          <p className="text-muted-foreground mt-1">View your upcoming shifts</p>
        </div>

        <div className="space-y-4">
          {baristaShifts.map((shift) => (
            <Card key={shift.id} className={isToday(shift.date) ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isToday(shift.date) ? 'bg-primary text-primary-foreground' : 'bg-accent'
                      }`}
                    >
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(shift.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{shift.role}</p>
                    </div>
                  </div>
                  {isToday(shift.date) && <Badge>Today</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{calculateDuration(shift.startTime, shift.endTime)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
