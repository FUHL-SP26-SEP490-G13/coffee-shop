import { useState, useEffect, useCallback, useRef } from 'react';
import {
  XCircle, CheckCircle, ChevronDown, Loader2,
  Send, Calendar, UserCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import swapRequestService from '../../../services/swapRequestService';
import shiftService from '../../../services/shiftService';
import { getColor, toStr, getDayName, fmtDateShort, fmtTime } from './swapHelpers';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ name, size = 8 }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── ColleagueSelect ──────────────────────────────────────────────────────────
function ColleagueSelect({ colleagues, value, onChange, loading, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = colleagues.find((c) => c.user_id === value?.user_id) || null;

  const handleSelect = (emp) => {
    onChange(emp);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !loading && setOpen((p) => !p)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
          ${open ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}
          ${loading ? 'opacity-60 cursor-not-allowed' : ''}
          bg-background`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
        ) : selected ? (
          <UserAvatar name={selected.name} size={7} />
        ) : (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
        <span className={`flex-1 text-sm truncate ${selected ? 'font-medium' : 'text-muted-foreground'}`}>
          {loading ? 'Đang tải...' : selected ? `${selected.name} (${selected.role})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown list */}
      {open && !loading && (
        <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-background border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {colleagues.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground text-center">Không tìm thấy đồng nghiệp cùng vị trí</div>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y">
              {colleagues.map((emp) => {
                const isActive = emp.user_id === selected?.user_id;
                return (
                  <button
                    key={emp.user_id}
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-primary/8 text-primary' : 'hover:bg-muted/50'}`}
                  >
                    <UserAvatar name={emp.name} size={7} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>{emp.name}</div>
                      <div className="text-[11px] text-muted-foreground">{emp.role}</div>
                    </div>
                    {isActive && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers tuần ─────────────────────────────────────────────────────────────
function getWeekStart(dateStr) {
  // Trả về ngày đầu tuần (Thứ 2) chứa dateStr
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=CN, 1=T2,...
  const diff = day === 0 ? -6 : 1 - day; // shift về thứ 2
  d.setDate(d.getDate() + diff);
  return toStr(d);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

function fmtWeekLabel(weekStartStr) {
  const start = new Date(weekStartStr);
  const end = new Date(weekStartStr);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => `${d.getDate()} thg ${d.getMonth() + 1}`;
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SHIFT_COLORS_SUMMARY = [
  { key: 'yellow', label: 'Ca Sáng' },
  { key: 'blue', label: 'Ca Chiều' },
  { key: 'purple', label: 'Ca Tối' },
];

// ─── CreateSwapDialog ─────────────────────────────────────────────────────────
export function CreateSwapDialog({ open, onClose, onCreated, myUserId }) {
  const [step, setStep] = useState(1);

  // Step 1 – lịch của mình
  const [myShifts, setMyShifts] = useState([]);
  const [loadingMyShifts, setLoadingMyShifts] = useState(false);

  // Step 2 – loại + người nhận
  const [selectedMyShift, setSelectedMyShift] = useState(null);
  const [swapType, setSwapType] = useState('give_away');

  // give_away: danh sách đồng nghiệp cùng role, isActive=1
  const [colleagues, setColleagues] = useState([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);

  // exchange: lịch tuần của receiver
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [selectedReceiverShift, setSelectedReceiverShift] = useState(null);
  const [receiverSchedule, setReceiverSchedule] = useState({}); // { date: [shift, ...] }
  const [loadingReceiverSchedule, setLoadingReceiverSchedule] = useState(false);
  const [weekStart, setWeekStart] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // ── Reset khi mở dialog ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    resetForm();
    loadMyShifts();
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setSelectedMyShift(null);
    setSwapType('give_away');
    setSelectedReceiver(null);
    setSelectedReceiverShift(null);
    setReceiverSchedule({});
    setColleagues([]);
    setWeekStart('');
  };

  // ── Load lịch của mình ───────────────────────────────────────────────────
  const loadMyShifts = async () => {
    try {
      setLoadingMyShifts(true);
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 60);
      const res = await shiftService.getMySchedule({ start_date: toStr(today), end_date: toStr(end) });
      const data = res?.data?.data || res?.data || [];
      const me = data[0];
      if (!me?.schedule) { setMyShifts([]); return; }
      const shifts = [];
      Object.entries(me.schedule).forEach(([date, dateShifts]) => {
        if (date >= toStr(today)) {
          dateShifts.forEach((s) => shifts.push({ ...s, date }));
        }
      });
      shifts.sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));
      setMyShifts(shifts);
    } catch {
      toast.error('Không thể tải lịch');
    } finally {
      setLoadingMyShifts(false);
    }
  };

  // ── Load đồng nghiệp cùng role (give_away) ───────────────────────────────
  const loadColleagues = async () => {
    try {
      setLoadingColleagues(true);
      const res = await shiftService.getColleagues();
      setColleagues(res?.data?.data || res?.data || []);
    } catch {
      toast.error('Không thể tải danh sách đồng nghiệp');
    } finally {
      setLoadingColleagues(false);
    }
  };

  // ── Load lịch tuần của receiver (exchange) ───────────────────────────────
  const loadReceiverWeek = useCallback(async (receiver, wStart) => {
    if (!receiver) return;
    try {
      setLoadingReceiverSchedule(true);
      const wEnd = addDays(wStart, 6);
      const res = await shiftService.getSchedule({ start_date: wStart, end_date: wEnd });
      const data = res?.data?.data || res?.data || [];
      const emp = data.find((e) => e.user_id === receiver.user_id);
      setReceiverSchedule(emp?.schedule || {});
    } catch {
      toast.error('Không thể tải lịch đồng nghiệp');
    } finally {
      setLoadingReceiverSchedule(false);
    }
  }, []);

  // ── Chọn ca của mình ─────────────────────────────────────────────────────
  const handleSelectMyShift = (shift) => {
    setSelectedMyShift(shift);
    setSelectedReceiver(null);
    setSelectedReceiverShift(null);
    setReceiverSchedule({});
    const ws = getWeekStart(shift.date);
    setWeekStart(ws);
    setStep(2);
    // Load đồng nghiệp ngay (cho give_away). Exchange cũng cần danh sách này để select người
    loadColleagues();
  };

  // ── Khi chọn receiver (exchange) → load lịch tuần ───────────────────────
  const handleSelectReceiver = (emp) => {
    setSelectedReceiver(emp);
    setSelectedReceiverShift(null);
    setReceiverSchedule({});
    if (swapType === 'exchange') {
      const ws = getWeekStart(selectedMyShift.date);
      setWeekStart(ws);
      loadReceiverWeek(emp, ws);
    }
  };

  // ── Đổi loại swap ────────────────────────────────────────────────────────
  const handleSwapTypeChange = (value) => {
    setSwapType(value);
    setSelectedReceiverShift(null);
    setReceiverSchedule({});
    if (value === 'exchange' && selectedReceiver) {
      const ws = getWeekStart(selectedMyShift.date);
      setWeekStart(ws);
      loadReceiverWeek(selectedReceiver, ws);
    }
  };

  // ── Chuyển tuần (exchange) ────────────────────────────────────────────────
  const handlePrevWeek = () => {
    const prev = addDays(weekStart, -7);
    setWeekStart(prev);
    setSelectedReceiverShift(null);
    loadReceiverWeek(selectedReceiver, prev);
  };
  const handleNextWeek = () => {
    const next = addDays(weekStart, 7);
    setWeekStart(next);
    setSelectedReceiverShift(null);
    loadReceiverWeek(selectedReceiver, next);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedMyShift || !selectedReceiver) return;
    try {
      setSubmitting(true);
      const payload = {
        requester_shift_id: selectedMyShift.shift_id,
        receiver_id: selectedReceiver.user_id,
      };
      if (swapType === 'exchange' && selectedReceiverShift) {
        payload.receiver_shift_id = selectedReceiverShift.shift_id;
      }
      await swapRequestService.createSwapRequest(payload);
      toast.success('Đã gửi yêu cầu đổi ca!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Group lịch của mình theo ngày
  const shiftsByDate = myShifts.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  // Các ngày trong tuần hiện tại (T2 → CN)
  const weekDays = weekStart
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [];

  const canSubmit =
    selectedReceiver &&
    (swapType === 'give_away' || (swapType === 'exchange' && selectedReceiverShift));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-2xl w-full max-w-lg mx-4 max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tạo yêu cầu đổi ca</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-2 mt-3">
            {[{ n: 1, label: 'Chọn ca của bạn' }, { n: 2, label: 'Chọn người & ca' }].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px bg-border" />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
                  ${step >= n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{n}</span>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ══ STEP 1: Chọn ca của mình ══ */}
          {step === 1 && (
            <div className="space-y-4">
              {loadingMyShifts && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Đang tải lịch...</span>
                </div>
              )}
              {!loadingMyShifts && Object.keys(shiftsByDate).length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">Không có ca nào</p>
                  <p className="text-xs text-muted-foreground mt-1">Bạn không có ca làm trong 60 ngày tới</p>
                </div>
              )}
              {!loadingMyShifts && Object.entries(shiftsByDate).map(([date, shifts]) => {
                const todayStr = toStr(new Date());
                const isToday = date === todayStr;
                const isTomorrow = date === toStr(new Date(Date.now() + 86400000));
                const dayLabel = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : getDayName(date);
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{dayLabel}</span>
                      <span className="text-xs text-muted-foreground/60">{fmtDateShort(date)}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-1.5">
                      {shifts.map((s, i) => {
                        const c = getColor(s.color);
                        return (
                          <button
                            key={`${s.date}-${s.registration_id || i}`}
                            onClick={() => handleSelectMyShift(s)}
                            className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md hover:scale-[1.005] active:scale-[0.99] ${c.bg} ${c.border}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-8 rounded-full ${c.dot}`} />
                                <div>
                                  <div className={`font-bold text-sm ${c.text}`}>{s.template_name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</div>
                                </div>
                              </div>
                              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Ca đã chọn */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${getColor(selectedMyShift?.color).dot}`} />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${getColor(selectedMyShift?.color).text}`}>{selectedMyShift?.template_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Ca của bạn: {getDayName(selectedMyShift?.date)}, {fmtDateShort(selectedMyShift?.date)} • {fmtTime(selectedMyShift?.start_time)} – {fmtTime(selectedMyShift?.end_time)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setStep(1); setSelectedReceiver(null); setSelectedReceiverShift(null); }}
                  className="text-xs text-primary hover:underline flex-shrink-0 font-medium"
                >
                  Đổi ca
                </button>
              </div>

              {/* Loại */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Hình thức</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'give_away', label: 'Nhường ca', desc: 'Bạn nhường ca, người kia lấy' },
                    { value: 'exchange', label: 'Đổi ca', desc: 'Đổi ca của nhau' },
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => handleSwapTypeChange(value)}
                      className={`relative p-3 rounded-xl border text-left transition-all
                        ${swapType === value ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-muted/50 hover:border-border'}`}
                    >
                      <div className={`text-sm font-semibold ${swapType === value ? 'text-primary' : ''}`}>{label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
                      {swapType === value && (
                        <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-primary" /></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── GIVE AWAY: chọn đồng nghiệp cùng role, isActive=1 ── */}
              {swapType === 'give_away' && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Chọn đồng nghiệp nhận ca</div>
                  <ColleagueSelect
                    colleagues={colleagues}
                    value={selectedReceiver}
                    onChange={setSelectedReceiver}
                    loading={loadingColleagues}
                    placeholder="Chọn đồng nghiệp..."
                  />
                </div>
              )}

              {/* ── EXCHANGE: chọn đồng nghiệp + chọn ca theo tuần ── */}
              {swapType === 'exchange' && (
                <>
                  {/* B1: Chọn đồng nghiệp */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Chọn đồng nghiệp muốn đổi ca</div>
                    <ColleagueSelect
                      colleagues={colleagues}
                      value={selectedReceiver}
                      onChange={handleSelectReceiver}
                      loading={loadingColleagues}
                      placeholder="Chọn đồng nghiệp..."
                    />
                  </div>

                  {/* B2: Lịch tuần của receiver */}
                  {selectedReceiver && (
                    <div className="rounded-xl border overflow-hidden">
                      {/* Header tuần */}
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                        <span className="text-sm font-semibold">Ca của {selectedReceiver.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handlePrevWeek}
                            className="p-1 rounded-lg hover:bg-muted transition-colors"
                            title="Tuần trước"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-muted-foreground font-medium min-w-[130px] text-center">
                            {weekStart ? fmtWeekLabel(weekStart) : ''}
                          </span>
                          <button
                            onClick={handleNextWeek}
                            className="p-1 rounded-lg hover:bg-muted transition-colors"
                            title="Tuần sau"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Loading */}
                      {loadingReceiverSchedule && (
                        <div className="flex items-center justify-center py-8 gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Đang tải lịch...</span>
                        </div>
                      )}

                      {/* Danh sách ca theo tuần */}
                      {!loadingReceiverSchedule && (
                        <div className="divide-y max-h-60 overflow-y-auto">
                          {weekDays.map((dayStr) => {
                            const shifts = receiverSchedule[dayStr] || [];
                            if (shifts.length === 0) return null;
                            return shifts.map((s, i) => {
                              const c = getColor(s.color);
                              const isSelected = selectedReceiverShift?.shift_id === s.shift_id;
                              return (
                                <button
                                  key={`${dayStr}-${s.shift_id || i}`}
                                  onClick={() => setSelectedReceiverShift(isSelected ? null : s)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                                    ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                >
                                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-sm ${c.text}`}>{s.template_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {getDayName(dayStr)}, {fmtDateShort(dayStr)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground font-medium">
                                    {fmtTime(s.start_time)}-{fmtTime(s.end_time)}
                                  </div>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                                </button>
                              );
                            });
                          })}

                          {/* Không có ca nào trong tuần này */}
                          {weekDays.every((d) => !(receiverSchedule[d]?.length > 0)) && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              {selectedReceiver.name} không có ca trong tuần này
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="px-6 py-4 border-t bg-muted/20 shrink-0 flex gap-3">
            <button
              onClick={() => { setStep(1); setSelectedReceiver(null); setSelectedReceiverShift(null); }}
              className="flex-1 px-4 py-3 rounded-xl border font-semibold text-sm hover:bg-muted/50 transition-all"
            >
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi yêu cầu {swapType === 'give_away' ? 'nhường ca' : 'đổi ca'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
