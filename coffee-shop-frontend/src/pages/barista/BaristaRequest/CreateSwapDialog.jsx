import { useState, useEffect } from 'react';
import {
  XCircle, CheckCircle, ChevronDown, Loader2,
  Send, Calendar, UserCheck, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import swapRequestService from '@/services/swapRequestService';
import shiftService from '@/services/shiftService';
import { getColor, toStr, getDayName, fmtDateShort, fmtTime } from './swapHelpers';

// ─── Avatar (local) ──────────────────────────────────────────────────────────
function UserAvatar({ name }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── CreateSwapDialog ─────────────────────────────────────────────────────────
export function CreateSwapDialog({ open, onClose, onCreated, myUserId }) {
  const [step, setStep] = useState(1);
  const [myShifts, setMyShifts] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [selectedMyShift, setSelectedMyShift] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [selectedReceiverShift, setSelectedReceiverShift] = useState(null);
  const [swapType, setSwapType] = useState('give_away');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    resetForm();
    loadMyShifts();
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setSelectedMyShift(null);
    setSelectedReceiver(null);
    setSelectedReceiverShift(null);
    setSwapType('give_away');
  };

  const loadMyShifts = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);
      const res = await shiftService.getMySchedule({
        start_date: toStr(today),
        end_date: toStr(twoWeeksLater),
      });
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
      setLoading(false);
    }
  };

  const loadTeamForDate = async (shiftDate) => {
    try {
      setLoading(true);
      const res = await shiftService.getSchedule({ start_date: shiftDate, end_date: shiftDate });
      const data = res?.data?.data || res?.data || [];
      setTeamData(data.filter((emp) => emp.user_id !== myUserId && emp.role?.toLowerCase() === 'barista'));
    } catch {
      toast.error('Không thể tải danh sách đồng nghiệp');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMyShift = (shift) => {
    setSelectedMyShift(shift);
    setSelectedReceiver(null);
    setSelectedReceiverShift(null);
    setStep(2);
    loadTeamForDate(shift.date);
  };

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

  const shiftsByDate = myShifts.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tạo yêu cầu đổi ca</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {[{ n: 1, label: 'Chọn ca' }, { n: 2, label: 'Chọn người & gửi' }].map(({ n, label }, i) => (
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Đang tải...</span>
            </div>
          )}

          {/* STEP 1 */}
          {!loading && step === 1 && (
            <div className="space-y-4">
              {Object.keys(shiftsByDate).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">Không có ca nào</p>
                  <p className="text-xs text-muted-foreground mt-1">Bạn không có ca làm trong 2 tuần tới</p>
                </div>
              ) : Object.entries(shiftsByDate).map(([date, shifts]) => {
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

          {/* STEP 2 */}
          {!loading && step === 2 && (
            <div className="space-y-5">
              {/* Ca đã chọn */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${getColor(selectedMyShift?.color).dot}`} />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${getColor(selectedMyShift?.color).text}`}>{selectedMyShift?.template_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {getDayName(selectedMyShift?.date)} {fmtDateShort(selectedMyShift?.date)} • {fmtTime(selectedMyShift?.start_time)} – {fmtTime(selectedMyShift?.end_time)}
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
                  {[{ value: 'give_away', label: 'Nhường ca' }, { value: 'exchange', label: 'Đổi ca' }].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { setSwapType(value); setSelectedReceiverShift(null); }}
                      className={`relative p-3 rounded-xl border text-left transition-all
                        ${swapType === value ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'hover:bg-muted/50 hover:border-border'}`}
                    >
                      <div className={`text-sm font-semibold ${swapType === value ? 'text-primary' : ''}`}>{label}</div>
                      {swapType === value && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-primary" /></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn đồng nghiệp */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Chọn đồng nghiệp</div>
                {teamData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed">
                    Không tìm thấy đồng nghiệp nào
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 rounded-xl">
                    {teamData.map((emp) => {
                      const isSelected = selectedReceiver?.user_id === emp.user_id;
                      const hasShifts = (emp.schedule?.[selectedMyShift?.date] || []).length > 0;
                      return (
                        <button
                          key={emp.user_id}
                          onClick={() => { setSelectedReceiver(emp); setSelectedReceiverShift(null); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
                            ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted/30'}`}
                        >
                          <UserAvatar name={emp.name} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{emp.name}</div>
                            <div className="text-[11px] text-muted-foreground">{emp.role}</div>
                          </div>
                          {hasShifts && swapType === 'exchange' && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">Có ca</span>
                          )}
                          {isSelected && <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exchange: chọn ca người nhận */}
              {swapType === 'exchange' && selectedReceiver && (() => {
                const receiverShifts = selectedReceiver.schedule?.[selectedMyShift?.date] || [];
                if (receiverShifts.length === 0) return (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm">
                    <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-800 dark:text-yellow-300">
                      {selectedReceiver.name} không có ca ngày {fmtDateShort(selectedMyShift?.date)}.
                      Hãy chọn <strong>Nhường ca</strong> hoặc chọn người khác.
                    </span>
                  </div>
                );
                return (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Chọn ca của {selectedReceiver.name}</div>
                    <div className="space-y-1.5">
                      {receiverShifts.map((s, i) => {
                        const c = getColor(s.color);
                        const selected = selectedReceiverShift?.shift_id === s.shift_id;
                        return (
                          <button
                            key={s.shift_id || i}
                            onClick={() => setSelectedReceiverShift(s)}
                            className={`w-full text-left flex items-center gap-3 rounded-xl border p-2.5 transition-all
                              ${selected ? 'ring-2 ring-primary border-primary' : ''} ${c.bg} ${c.border}`}
                          >
                            <div className={`w-1.5 h-6 rounded-full ${c.dot}`} />
                            <div className="flex-1">
                              <div className={`font-bold text-xs ${c.text}`}>{s.template_name}</div>
                              <div className="text-xs text-muted-foreground">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</div>
                            </div>
                            {selected && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && !loading && (
          <div className="px-6 py-4 border-t bg-muted/20">
            <button
              onClick={handleSubmit}
              disabled={!selectedReceiver || (swapType === 'exchange' && !selectedReceiverShift) || submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
