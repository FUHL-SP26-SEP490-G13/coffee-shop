import { tables } from '../../lib/mockData';
import { Users } from 'lucide-react';

export function StaffTables() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 border-green-500 text-green-700';
      case 'occupied':
        return 'bg-primary/10 border-primary text-primary';
      case 'reserved':
        return 'bg-yellow-500/10 border-yellow-500 text-yellow-700';
      default:
        return '';
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-6">Table Management</h2>

      <div className="grid grid-cols-4 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            className={`aspect-square rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all hover:shadow-md ${getStatusColor(
              table.status
            )}`}
          >
            <div className="text-3xl mb-2">{table.number}</div>
            <div className="flex items-center gap-1 text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>{table.capacity}</span>
            </div>
            <div className="text-xs capitalize">{table.status}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/20 border border-primary"></div>
          <span className="text-sm text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
          <span className="text-sm text-muted-foreground">Reserved</span>
        </div>
      </div>
    </div>
  );
}
