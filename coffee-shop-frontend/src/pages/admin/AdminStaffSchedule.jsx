import { shifts, users } from '../../lib/mockData';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

export default function AdminStaffSchedule() {
  const dates = ['Feb 6', 'Feb 7', 'Feb 8', 'Feb 9', 'Feb 10', 'Feb 11', 'Feb 12'];
  const staffMembers = users.filter((u) => u.role === 'staff');

  const getShiftForDate = (staffId, date) => {
    return shifts.find((s) => s.staffId === staffId && s.date === date);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">Staff Schedule</h2>
          <p className="text-sm text-muted-foreground">Manage employee work schedules</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 bg-secondary">Staff</th>
                {dates.map((date) => (
                  <th key={date} className="p-4 bg-secondary text-sm">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="border-b border-border">
                  <td className="p-4">
                    <div className="text-sm">{staff.name}</div>
                    <div className="text-xs text-muted-foreground">{staff.role}</div>
                  </td>
                  {dates.map((date, index) => {
                    const dateStr = `2026-02-${(6 + index).toString().padStart(2, '0')}`;
                    const shift = getShiftForDate(staff.id, dateStr);
                    return (
                      <td key={date} className="p-4">
                        {shift ? (
                          <div className="bg-primary/10 rounded-lg p-2 text-center">
                            <Badge variant="secondary" className="text-xs mb-1">
                              {shift.role}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                        ) : (
                          <button className="w-full p-2 rounded-lg border-2 border-dashed border-border hover:bg-secondary text-muted-foreground text-xs">
                            + Add
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
