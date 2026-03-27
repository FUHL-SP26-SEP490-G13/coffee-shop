import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import shiftService from '../../../../services/shiftService';
import AssignSingleModal from './action/AssignSingleModal';
import AssignBulkModal from './action/AssignBulkModal';

// ─── Color map ───────────────────────────────────────────────────────────────
const COLOR_MAP = {
  red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-400' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
};
const getColor = (v) => COLOR_MAP[v] || COLOR_MAP.blue;

// ─── Date helpers ────────────────────────────────────────────────────────────
// Dùng local time (không phải UTC) để tránh lệch ngày ở UTC+7
const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtTime = (t) => t?.slice(0, 5) || '';

const getMonday = (d) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return m;
};

const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Shift chip ──────────────────────────────────────────────────────────────
function ShiftChip({ shift, compact = false }) {
  const c = getColor(shift.color);
  if (compact) {
    return (
      <div className={`rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight ${c.bg} ${c.text}`}>
        <div className="font-semibold truncate">{shift.template_name}</div>
        <div className="opacity-75">{fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}</div>
      </div>
    );
  }
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <div className="font-semibold">{shift.template_name}</div>
      <div className="opacity-75">{fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: NGÀY
// ════════════════════════════════════════════════════════════════════════════
function DayView({ date, employees }) {
  if (!employees.length) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Không có nhân viên nào được phân ca trong ngày này.
      </div>
    );
  }

  // Group theo template (ca)
  const caMap = {};
  employees.forEach((emp) => {
    const shifts = emp.schedule[toStr(date)] || [];
    shifts.forEach((s) => {
      if (!caMap[s.template_id]) {
        caMap[s.template_id] = { ...s, employees: [] };
      }
      caMap[s.template_id].employees.push(emp);
    });
  });

  const caList = Object.values(caMap).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <p className="font-medium text-muted-foreground capitalize">{dayName}</p>
      {caList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Không có ca nào hôm nay.</div>
      ) : (
        caList.map((ca) => {
          const c = getColor(ca.color);
          return (
            <div key={ca.template_id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{ca.template_name}</p>
                    <p className="text-xs text-muted-foreground">{fmtTime(ca.start_time)} – {fmtTime(ca.end_time)}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {ca.employees.length} người
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ca.employees.map((emp) => (
                  <div key={emp.user_id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.bg} border-current/20`}>
                    <Avatar name={emp.name} />
                    <div>
                      <p className={`text-xs font-semibold ${c.text}`}>{emp.name}</p>
                      <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: TUẦN
// ════════════════════════════════════════════════════════════════════════════
function WeekView({ weekStart, employees }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toStr(new Date());

  return (
    <div className="rounded-xl border overflow-auto">
      <table className="w-full min-w-[700px] text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40 border-r">Nhân viên</th>
            {days.map((d, i) => {
              const str = toStr(d);
              const isToday = str === todayStr;
              return (
                <th key={str} className={`text-center px-2 py-2.5 font-medium min-w-[100px] ${isToday ? 'bg-primary/5' : ''}`}>
                  <div className={`text-xs ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {DAY_LABELS[i]}
                  </div>
                  <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-primary' : ''}`}>
                    {d.getDate()}
                  </div>
                  <div className="text-[11px] opacity-50">Th{d.getMonth() + 1}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                Chưa có lịch phân ca trong tuần này.
              </td>
            </tr>
          ) : (
            employees.map((emp, idx) => (
              <tr key={emp.user_id} className={`border-t ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                <td className="px-4 py-3 border-r">
                  <div className="flex items-center gap-2">
                    <Avatar name={emp.name} size="md" />
                    <div>
                      <p className="font-medium text-xs leading-tight">{emp.name}</p>
                      <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                    </div>
                  </div>
                </td>
                {days.map((d) => {
                  const str = toStr(d);
                  const shifts = emp.schedule[str] || [];
                  return (
                    <td key={str} className={`px-1.5 py-2 align-top border-r last:border-r-0 ${toStr(d) === todayStr ? 'bg-primary/5' : ''}`}>
                      {shifts.length === 0 ? (
                        <span className="flex justify-center text-muted-foreground/20 text-lg">–</span>
                      ) : (
                        <div className="space-y-1">
                          {shifts.map((s) => <ShiftChip key={s.registration_id} shift={s} compact />)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: THÁNG
// ════════════════════════════════════════════════════════════════════════════
function MonthView({ year, month, employees }) {
  const todayStr = toStr(new Date());

  // Tạo grid ngày trong tháng
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Bắt đầu từ T2 của tuần chứa ngày đầu tháng
  const startGrid = getMonday(firstDay);
  const cells = [];
  let cur = new Date(startGrid);
  while (cur <= lastDay || cells.length % 7 !== 0) {
    cells.push(new Date(cur));
    cur = addDays(cur, 1);
    if (cells.length > 42) break;
  }

  // Build shift map: dateStr → [{ empName, shift }]
  const dayShiftMap = {};
  employees.forEach((emp) => {
    Object.entries(emp.schedule).forEach(([dateStr, shifts]) => {
      if (!dayShiftMap[dateStr]) dayShiftMap[dateStr] = [];
      shifts.forEach((s) => dayShiftMap[dateStr].push({ empName: emp.name, shift: s }));
    });
  });

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header T2→CN */}
      <div className="grid grid-cols-7 bg-muted/50 border-b">
        {DAY_LABELS.map((l) => (
          <div key={l} className="text-center py-2 text-xs font-medium text-muted-foreground">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const str = toStr(d);
          const inMonth = d.getMonth() === month;
          const isToday = str === todayStr;
          const dayShifts = dayShiftMap[str] || [];
          const showShifts = dayShifts.slice(0, 3);
          const extra = dayShifts.length - 3;

          return (
            <div
              key={i}
              className={[
                'min-h-[90px] p-1.5 border-b border-r last:border-r-0 text-xs',
                i % 7 === 6 ? 'border-r-0' : '',
                !inMonth ? 'bg-muted/20' : '',
                isToday ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : '',
              ].join(' ')}
            >
              <div className={`font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? 'bg-primary text-white' : inMonth ? '' : 'text-muted-foreground/40'}`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {showShifts.map((item, si) => {
                  const c = getColor(item.shift.color);
                  return (
                    <div key={si} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
                      {item.shift.template_name}
                    </div>
                  );
                })}
                {extra > 0 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{extra} khác</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function WorkSchedulePage() {
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [cursor, setCursor] = useState(new Date()); // ngày/tuần/tháng hiện tại
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSingle, setShowSingle] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  // Tính [start_date, end_date] theo viewMode
  const getRange = useCallback(() => {
    if (viewMode === 'day') {
      const s = toStr(cursor);
      return { start: s, end: s };
    }
    if (viewMode === 'week') {
      const mon = getMonday(cursor);
      return { start: toStr(mon), end: toStr(addDays(mon, 6)) };
    }
    // month
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    return { start: toStr(first), end: toStr(last) };
  }, [viewMode, cursor]);

  const fetchSchedule = useCallback(async () => {
    const { start, end } = getRange();
    try {
      setLoading(true);
      const res = await shiftService.getSchedule({ start_date: start, end_date: end });
      // console.log(res)
      setEmployees(res?.data?.data || res?.data || []);
    } catch {
      toast.error('Không thể tải lịch làm việc');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [getRange]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  // Navigate
  const go = (dir) => {
    setCursor((prev) => {
      const d = new Date(prev);
      if (viewMode === 'day') d.setDate(d.getDate() + dir);
      else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const goToday = () => setCursor(new Date());

  // Header label
  const headerLabel = () => {
    if (viewMode === 'day') {
      return cursor.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const mon = getMonday(cursor);
      const sun = addDays(mon, 6);
      const fmtShort = (d) => `${d.getDate()} thg ${d.getMonth() + 1}`;
      if (mon.getMonth() === sun.getMonth())
        return `${fmtShort(mon)} – ${fmtShort(sun)} ${sun.getFullYear()}`;
      return `${fmtShort(mon)} – ${fmtShort(sun)} ${sun.getFullYear()}`;
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  };

  const range = getRange();

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch làm việc</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Xem lịch phân ca nhân viên theo ngày / tuần / tháng</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} className="p-2 rounded-lg border hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[180px] text-center">{headerLabel()}</span>
          <button onClick={() => go(1)} className="p-2 rounded-lg border hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-secondary transition-colors font-medium">
            Hôm nay
          </button>
        </div>

        {/* View switcher + Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSingle(true)} className="gap-1.5 text-xs h-8">
            <UserPlus className="w-3.5 h-3.5" /> Gán 1 người
          </Button>
          <Button size="sm" onClick={() => setShowBulk(true)} className="gap-1.5 text-xs h-8">
            <Users className="w-3.5 h-3.5" /> Gán hàng loạt
          </Button>
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {[
              { key: 'day', label: 'Ngày' },
              { key: 'week', label: 'Tuần' },
              { key: 'month', label: 'Tháng' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${viewMode === key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {viewMode === 'day' && <DayView date={cursor} employees={employees} />}
          {viewMode === 'week' && <WeekView weekStart={getMonday(cursor)} employees={employees} />}
          {viewMode === 'month' && (
            <MonthView year={cursor.getFullYear()} month={cursor.getMonth()} employees={employees} />
          )}
        </>
      )}

      {/* Date range info */}
      {!loading && (
        <p className="text-[11px] text-muted-foreground text-right">
          Dữ liệu từ {range.start} đến {range.end} · {employees.length} nhân viên
        </p>
      )}

      {/* Modals */}
      <AssignSingleModal
        open={showSingle}
        onClose={() => setShowSingle(false)}
        onSuccess={fetchSchedule}
        defaultDate={viewMode === 'day' ? toStr(cursor) : toStr(new Date())}
      />
      <AssignBulkModal
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onSuccess={fetchSchedule}
      />
    </div>
  );
}
