import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
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
function ShiftChip({ shift, compact = false, onRemove }) {
  const c = getColor(shift.color);
  if (compact) {
    return (
      <div className={`group/chip relative rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight ${c.bg} ${c.text}`}>
        <div className="font-semibold truncate pr-4">{shift.template_name}</div>
        <div className="opacity-75">{fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}</div>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(shift); }}
            className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center
              opacity-0 group-hover/chip:opacity-100 transition-opacity
              bg-white/80 hover:bg-red-100 text-red-500 hover:text-red-700`}
            title="Xóa khỏi ca"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    );
  }
  return (
    <div className={`group/chip relative rounded-lg px-2.5 py-1.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <div className="font-semibold">{shift.template_name}</div>
      <div className="opacity-75">{fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}</div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(shift); }}
          className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center
            opacity-0 group-hover/chip:opacity-100 transition-opacity
            bg-white/80 hover:bg-red-100 text-red-500 hover:text-red-700`}
          title="Xóa khỏi ca"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW: NGÀY
// ════════════════════════════════════════════════════════════════════════════
function DayView({ date, employees, onRemove }) {
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
                {ca.employees.map((emp) => {
                  // Tìm registration_id từ schedule data
                  const empShifts = emp.schedule[toStr(date)] || [];
                  const matchedShift = empShifts.find(s => s.template_id === ca.template_id);
                  return (
                    <div key={emp.user_id} className={`group/emp relative flex items-center gap-2 px-3 py-2 rounded-lg border ${c.bg} border-current/20`}>
                      <Avatar name={emp.name} />
                      <div>
                        <p className={`text-xs font-semibold ${c.text}`}>{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                      </div>
                      {onRemove && matchedShift && (
                        <button
                          onClick={() => onRemove({ ...matchedShift, empName: emp.name })}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                            opacity-0 group-hover/emp:opacity-100 transition-opacity shadow-sm
                            bg-white hover:bg-red-50 text-red-400 hover:text-red-600 border border-red-200`}
                          title={`Xóa ${emp.name} khỏi ca`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
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
function WeekView({ weekStart, employees, onRemove }) {
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
                          {shifts.map((s) => <ShiftChip key={s.registration_id} shift={s} compact onRemove={onRemove ? (shift) => onRemove({ ...shift, empName: emp.name }) : undefined} />)}
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
function MonthView({ year, month, employees, onRemove }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const todayStr = toStr(new Date());

  // Tạo grid ngày trong tháng
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startGrid = getMonday(firstDay);
  const cells = [];
  let cur = new Date(startGrid);
  while (cur <= lastDay || cells.length % 7 !== 0) {
    cells.push(new Date(cur));
    cur = addDays(cur, 1);
    if (cells.length > 42) break;
  }

  // Build per-day → per-template grouped data
  // dayData[dateStr] = { totalPeople, templates: [{ template_id, template_name, color, start_time, end_time, employees: [{ empName, registration_id, ... }] }] }
  const dayData = {};
  employees.forEach((emp) => {
    Object.entries(emp.schedule).forEach(([dateStr, shifts]) => {
      if (!dayData[dateStr]) dayData[dateStr] = { totalPeople: new Set(), templates: {} };
      dayData[dateStr].totalPeople.add(emp.user_id);
      shifts.forEach((s) => {
        if (!dayData[dateStr].templates[s.template_id]) {
          dayData[dateStr].templates[s.template_id] = {
            template_id: s.template_id,
            template_name: s.template_name,
            color: s.color,
            start_time: s.start_time,
            end_time: s.end_time,
            employees: [],
          };
        }
        dayData[dateStr].templates[s.template_id].employees.push({
          empName: emp.name,
          role: emp.role,
          registration_id: s.registration_id,
          ...s,
        });
      });
    });
  });

  // Selected day detail data
  const selectedDayInfo = selectedDate ? dayData[selectedDate] : null;
  const selectedTemplates = selectedDayInfo
    ? Object.values(selectedDayInfo.templates).sort((a, b) => a.start_time.localeCompare(b.start_time))
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        {/* Header T2→CN */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {DAY_LABELS.map((l) => (
            <div key={l} className="text-center py-2.5 text-xs font-semibold text-muted-foreground tracking-wide">{l}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const str = toStr(d);
            const inMonth = d.getMonth() === month;
            const isToday = str === todayStr;
            const isSelected = str === selectedDate;
            const info = dayData[str];
            const totalPeople = info ? info.totalPeople.size : 0;
            const templates = info ? Object.values(info.templates).sort((a, b) => a.start_time.localeCompare(b.start_time)) : [];

            return (
              <div
                key={i}
                onClick={() => inMonth && setSelectedDate(isSelected ? null : str)}
                className={[
                  'min-h-[100px] p-1.5 border-b border-r text-xs transition-colors',
                  i % 7 === 6 ? 'border-r-0' : '',
                  !inMonth ? 'bg-muted/20 opacity-40' : 'cursor-pointer hover:bg-muted/30',
                  isToday && !isSelected ? 'bg-primary/5' : '',
                  isSelected ? 'bg-primary/10 ring-2 ring-inset ring-primary/40' : '',
                ].join(' ')}
              >
                {/* Date header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                    ${isToday ? 'bg-primary text-white' : inMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {d.getDate()}
                  </div>
                  {totalPeople > 0 && inMonth && (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {totalPeople} người
                    </span>
                  )}
                </div>

                {/* Shift template summary rows */}
                <div className="space-y-0.5">
                  {templates.slice(0, 4).map((tpl) => {
                    const c = getColor(tpl.color);
                    return (
                      <div key={tpl.template_id} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className={`truncate text-[10px] font-medium ${c.text}`}>
                          {tpl.template_name}
                        </span>
                        <span className={`text-[10px] font-bold ${c.text} ml-auto flex-shrink-0`}>
                          ×{tpl.employees.length}
                        </span>
                      </div>
                    );
                  })}
                  {templates.length > 4 && (
                    <div className="text-[10px] text-muted-foreground pl-3">+{templates.length - 4} ca</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDate && (
        <div className="rounded-xl border bg-card p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">
                {(() => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  const date = new Date(y, m - 1, d);
                  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedDayInfo ? `${selectedDayInfo.totalPeople.size} nhân viên · ${selectedTemplates.length} ca` : 'Không có ca nào'}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Không có ca nào được phân trong ngày này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedTemplates.map((tpl) => {
                const c = getColor(tpl.color);
                return (
                  <div key={tpl.template_id} className="rounded-xl border p-4 space-y-3">
                    {/* Template header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                          <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{tpl.template_name}</p>
                          <p className="text-xs text-muted-foreground">{fmtTime(tpl.start_time)} – {fmtTime(tpl.end_time)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        {tpl.employees.length} người
                      </span>
                    </div>

                    {/* Employee list */}
                    <div className="space-y-1.5">
                      {tpl.employees.map((emp) => (
                        <div key={emp.registration_id} className={`group/emp relative flex items-center gap-2 px-3 py-2 rounded-lg ${c.bg}`}>
                          <Avatar name={emp.empName} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate ${c.text}`}>{emp.empName}</p>
                            <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                          </div>
                          {onRemove && (
                            <button
                              onClick={() => onRemove({ ...emp, empName: emp.empName })}
                              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                                opacity-0 group-hover/emp:opacity-100 transition-opacity
                                bg-white/80 hover:bg-red-100 text-red-400 hover:text-red-600`}
                              title={`Xóa ${emp.empName} khỏi ca`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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
  const [removeTarget, setRemoveTarget] = useState(null); // shift to remove
  const [removing, setRemoving] = useState(false);

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
          {viewMode === 'day' && <DayView date={cursor} employees={employees} onRemove={setRemoveTarget} />}
          {viewMode === 'week' && <WeekView weekStart={getMonday(cursor)} employees={employees} onRemove={setRemoveTarget} />}
          {viewMode === 'month' && (
            <MonthView year={cursor.getFullYear()} month={cursor.getMonth()} employees={employees} onRemove={setRemoveTarget} />
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

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhân viên khỏi ca</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.empName ? (
                <>Bạn có chắc muốn xóa <strong>{removeTarget.empName}</strong> khỏi ca <strong>{removeTarget.template_name}</strong>?</>
              ) : (
                <>Bạn có chắc muốn xóa ca <strong>{removeTarget?.template_name}</strong> này?</>
              )}
              {' '}Hành động này có thể hoàn tác bằng cách gán lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                try {
                  setRemoving(true);
                  await shiftService.removeRegistration(removeTarget.registration_id);
                  toast.success('Đã xóa nhân viên khỏi ca');
                  setRemoveTarget(null);
                  fetchSchedule();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Không thể xóa');
                } finally {
                  setRemoving(false);
                }
              }}
            >
              {removing ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
