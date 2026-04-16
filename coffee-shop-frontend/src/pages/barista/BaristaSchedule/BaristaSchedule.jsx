import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Users, User, Coffee, Star } from 'lucide-react';
import { toast } from 'sonner';
import shiftService from '../../../services/shiftService';
import authenticationService from '../../../services/authenticationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const COLOR_MAP = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', border: 'border-green-200 dark:border-green-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-800' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800' },
};
const getColor = (v) => COLOR_MAP[v] || COLOR_MAP.blue;

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

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: LỊCH CỦA TÔI — dạng bảng tuần ngang compact
// ═══════════════════════════════════════════════════════════════════════════
function MyScheduleView({ weekStart, schedule, loading }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toStr(new Date());

  // Stats
  const totalShifts = Object.values(schedule).reduce((sum, arr) => sum + arr.length, 0);
  const totalMinutes = Object.values(schedule).flat().reduce((sum, s) => {
    const [sh, sm] = (s.start_time || '').slice(0, 5).split(':').map(Number);
    const [eh, em] = (s.end_time || '').slice(0, 5).split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    // Ca qua đêm: end <= start → cộng thêm 1440 phút (24h)
    const duration = endMins > startMins ? endMins - startMins : endMins - startMins + 1440;
    return sum + duration;
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold">{totalShifts} ca</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold">
            {totalShifts > 0 ? `${totalHours}h${totalMins > 0 ? `${totalMins}p` : ''}` : '0h'}
          </span>
        </div>
      </div>

      {/* Week grid — 7 columns */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const str = toStr(d);
          const isToday = str === todayStr;
          const isPast = str < todayStr;
          const shifts = schedule[str] || [];
          const hasShift = shifts.length > 0;

          return (
            <div
              key={str}
              className={[
                'rounded-xl border p-3 min-h-[140px] flex flex-col transition-all',
                isToday ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20 shadow-sm' : '',
                isPast && !isToday ? 'opacity-50' : '',
                !hasShift && !isToday ? 'bg-muted/30' : '',
              ].join(' ')}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {DAY_SHORT[i]}
                </div>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold mt-0.5
                  ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                  {d.getDate()}
                </div>
                {isToday && (
                  <div className="text-[10px] font-semibold text-primary mt-0.5">Hôm nay</div>
                )}
              </div>

              {/* Shifts or Off */}
              <div className="flex-1 flex flex-col gap-1.5">
                {hasShift ? (
                  shifts.map((s) => {
                    const c = getColor(s.color);
                    return (
                      <div key={s.registration_id} className={`rounded-lg p-2 border ${c.bg} ${c.border}`}>
                        <div className={`text-xs font-bold ${c.text} truncate`}>{s.template_name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground/60 bg-muted/50 px-2.5 py-1 rounded-full">
                      Nghỉ
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No shifts at all message */}
      {totalShifts === 0 && (
        <div className="text-center py-6 space-y-2">
          <Coffee className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Bạn chưa được phân ca trong tuần này.</p>
          <p className="text-xs text-muted-foreground/60">Hãy liên hệ quản lý để được phân ca, hoặc xem tab Tổng quan.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: LỊCH TỔNG QUAN (tất cả nhân viên)
// ═══════════════════════════════════════════════════════════════════════════
function TeamScheduleView({ weekStart, employees, loading, myUserId }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toStr(new Date());

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">Chưa có lịch phân ca trong tuần này.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-auto">
      <table className="w-full min-w-[700px] text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-44 border-r border-border">
              Nhân viên
            </th>
            {days.map((d, i) => {
              const str = toStr(d);
              const isToday = str === todayStr;
              return (
                <th key={str} className={`text-center px-2 py-2.5 font-medium min-w-[110px] border-r last:border-r-0 border-border
                  ${isToday ? 'bg-primary/10 dark:bg-primary/20' : ''}`}>
                  <div className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {DAY_LABELS[i]}
                  </div>
                  <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                  {isToday && (
                    <div className="text-[10px] font-semibold text-primary">Hôm nay</div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Sort: đưa mình lên đầu */}
          {[...employees].sort((a, b) => {
            if (a.user_id === myUserId) return -1;
            if (b.user_id === myUserId) return 1;
            return 0;
          }).map((emp, idx) => {
            const isMe = emp.user_id === myUserId;
            return (
              <tr key={emp.user_id} className={[
                'border-t border-border',
                isMe
                  ? 'bg-primary/5 dark:bg-primary/10'
                  : idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
              ].join(' ')}>
                <td className={`px-4 py-3 border-r border-border ${isMe ? 'border-l-[3px] border-l-primary' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    {isMe ? (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center flex-shrink-0 text-xs">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <Avatar name={emp.name} size="md" />
                    )}
                    <div>
                      <p className={`font-semibold text-xs leading-tight ${isMe ? 'text-primary' : ''}`}>
                        {emp.name} {isMe && <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1"></span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                    </div>
                  </div>
                </td>
                {days.map((d) => {
                  const str = toStr(d);
                  const isToday = str === todayStr;
                  const shifts = emp.schedule[str] || [];
                  return (
                    <td key={str} className={`px-1.5 py-2 align-top border-r last:border-r-0 border-border
                    ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                      {shifts.length === 0 ? (
                        <span className="flex justify-center text-muted-foreground/30 text-sm py-2">–</span>
                      ) : (
                        <div className="space-y-1">
                          {shifts.map((s) => {
                            const c = getColor(s.color);
                            return (
                              <div key={s.registration_id} className={`rounded-lg px-2 py-1.5 text-[11px] font-medium leading-tight ${c.bg} ${c.text} border ${c.border}`}>
                                <div className="font-bold truncate">{s.template_name}</div>
                                <div className="opacity-75 mt-0.5">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function BaristaSchedule() {
  const [tab, setTab] = useState('me');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [mySchedule, setMySchedule] = useState({});
  const [teamEmployees, setTeamEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myUserId, setMyUserId] = useState(null);

  // Lấy user ID của mình 1 lần
  useEffect(() => {
    authenticationService.getProfile()
      .then((res) => {
        const user = res?.data?.id ? res.data : res?.data?.data || null;
        if (user?.id) setMyUserId(user.id);
      })
      .catch(() => { });
  }, []);

  const fetchData = useCallback(async () => {
    const start = toStr(weekStart);
    const end = toStr(addDays(weekStart, 6));
    try {
      setLoading(true);
      if (tab === 'me') {
        const res = await shiftService.getMySchedule({ start_date: start, end_date: end });
        const data = res?.data?.data || res?.data || [];
        const me = data[0];
        setMySchedule(me?.schedule || {});
      } else {
        const res = await shiftService.getSchedule({ start_date: start, end_date: end });
        const data = res?.data?.data || res?.data || [];
        setTeamEmployees(data);
      }
    } catch {
      toast.error('Không thể tải lịch làm việc');
      if (tab === 'me') setMySchedule({});
      else setTeamEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const go = (dir) => setWeekStart((prev) => addDays(prev, dir * 7));
  const goToday = () => setWeekStart(getMonday(new Date()));
  const sun = addDays(weekStart, 6);
  const fmtShort = (d) => `${d.getDate()} thg ${d.getMonth() + 1}`;
  const headerLabel = `${fmtShort(weekStart)} – ${fmtShort(sun)}, ${sun.getFullYear()}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lịch làm việc</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Xem lịch ca của bạn và đồng nghiệp</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setTab('me')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'me' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <User className="w-4 h-4" /> Của tôi
          </button>
          <button
            onClick={() => setTab('team')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'team' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" /> Tổng quan
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button onClick={() => go(-1)} className="p-2 rounded-lg border hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold min-w-[200px] text-center">{headerLabel}</span>
        <button onClick={() => go(1)} className="p-2 rounded-lg border hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={goToday} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-secondary transition-colors font-medium ml-1">
          Tuần này
        </button>
      </div>

      {/* Content */}
      {tab === 'me' ? (
        <MyScheduleView weekStart={weekStart} schedule={mySchedule} loading={loading} />
      ) : (
        <TeamScheduleView weekStart={weekStart} employees={teamEmployees} loading={loading} myUserId={myUserId} />
      )}
    </div>
  );
}

export default BaristaSchedule;
