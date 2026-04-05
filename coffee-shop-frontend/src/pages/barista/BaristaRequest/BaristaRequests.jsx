import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Gift, Plus, Clock, CheckCircle, XCircle, Ban,
  AlertCircle, Loader2, RefreshCw, Send, Inbox, ChevronDown, ChevronUp,
  Calendar, UserCheck, ArrowRight, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import swapRequestService from '@/services/swapRequestService';
import shiftService from '@/services/shiftService';
import authenticationService from '@/services/authenticationService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtTime = (t) => t?.slice(0, 5) || '';
const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};
const fmtDateShort = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};
const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const getDayName = (dateStr) => {
  const d = new Date(dateStr);
  return DAY_NAMES[d.getDay()];
};
const timeAgo = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return fmtDate(dateStr);
};

const COLOR_MAP = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
};
const getColor = (v) => COLOR_MAP[v] || COLOR_MAP.blue;

const STATUS_CONFIG = {
  pending: { label: 'Chờ phản hồi', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', ringColor: 'ring-yellow-300 dark:ring-yellow-700' },
  accepted: { label: 'Đã chấp nhận', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', ringColor: '' },
  rejected: { label: 'Đã từ chối', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', ringColor: '' },
  cancelled: { label: 'Đã hủy', icon: Ban, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', ringColor: '' },
};

// ─── Avatar ─────────────────────────────────────────────────────────────────
function UserAvatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── ShiftBadge ─────────────────────────────────────────────────────────────
function ShiftBadge({ shift, label, compact }) {
  if (!shift) return null;
  const c = getColor(shift.color);
  return (
    <div className={`rounded-xl border ${compact ? 'p-2' : 'p-3'} ${c.bg} ${c.border}`}>
      {label && <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>}
      <div className={`font-bold ${compact ? 'text-xs' : 'text-sm'} ${c.text}`}>{shift.template_name}</div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
        <Calendar className="w-3 h-3" />
        {fmtDate(shift.date)}
        <span className="text-muted-foreground/50">•</span>
        <Clock className="w-3 h-3" />
        {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
      </div>
    </div>
  );
}

// ─── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SwapRequestCard — auto-expand pending received + improved layout
// ═══════════════════════════════════════════════════════════════════════════════
function SwapRequestCard({ req, myUserId, onAction, actionLoading }) {
  const isSender = req.requester.id === myUserId;
  const isReceiver = req.receiver.id === myUserId;
  const isExchange = req.type === 'exchange';
  const isPendingReceived = req.status === 'pending' && isReceiver;
  const [expanded, setExpanded] = useState(isPendingReceived);

  const otherPerson = isSender ? req.receiver : req.requester;

  return (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md
      ${isPendingReceived ? 'ring-2 ring-yellow-300 dark:ring-yellow-700' : ''}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <UserAvatar name={otherPerson.name} />
          <div className="min-w-0">
            <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
              <span className="truncate">{otherPerson.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${isExchange
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {isExchange ? 'Đổi ca' : 'Nhường ca'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {isSender ? (
                <><Send className="w-3 h-3" /> Bạn gửi</>
              ) : (
                <><Inbox className="w-3 h-3" /> Gửi cho bạn</>
              )}
              <span className="text-muted-foreground/40">•</span>
              {timeAgo(req.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={req.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t">
          {/* Shift cards */}
          <div className="px-4 pt-3 pb-2">
            {isExchange ? (
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <ShiftBadge shift={req.requester_shift} label={isSender ? 'Ca của bạn' : `Ca ${req.requester.name}`} compact />
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground font-medium">ĐỔI</span>
                </div>
                <ShiftBadge shift={req.receiver_shift} label={isReceiver ? 'Ca của bạn' : `Ca ${req.receiver.name}`} compact />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ShiftBadge shift={req.requester_shift} label={isSender ? 'Ca bạn nhường' : `Ca ${req.requester.name} nhường`} compact />
                </div>
                <div className="flex flex-col items-center gap-0.5 px-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="w-24 flex flex-col items-center py-3">
                  <UserAvatar name={req.receiver.name} size="sm" />
                  <span className="text-[10px] font-medium text-muted-foreground mt-1 text-center truncate w-full">
                    {isReceiver ? 'Bạn' : req.receiver.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {req.status === 'pending' && (
            <div className="flex gap-2 px-4 py-3 bg-muted/20 border-t">
              {isReceiver && (
                <>
                  <button
                    onClick={() => onAction(req.id, 'accept')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => onAction(req.id, 'reject')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Từ chối
                  </button>
                </>
              )}
              {isSender && (
                <button
                  onClick={() => onAction(req.id, 'cancel')}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Hủy yêu cầu
                </button>
              )}
            </div>
          )}

          {/* Responded info */}
          {req.responded_at && (
            <div className="text-xs text-muted-foreground px-4 py-2 border-t bg-muted/10">
              Phản hồi lúc: {new Date(req.responded_at).toLocaleString('vi-VN')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CreateSwapDialog — grouped-by-date + better teammate picker
// ═══════════════════════════════════════════════════════════════════════════════
function CreateSwapDialog({ open, onClose, onCreated, myUserId }) {
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
      // Load 1 tuần để tìm tất cả đồng nghiệp
      const res = await shiftService.getSchedule({
        start_date: shiftDate,
        end_date: shiftDate,
      });
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
      const msg = err?.response?.data?.message || 'Không thể gửi yêu cầu';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Group shifts by date for step 1
  const shiftsByDate = myShifts.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Dialog header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tạo yêu cầu đổi ca</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
              ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              Chọn ca
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all
              ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              Chọn người & gửi
            </div>
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

          {/* STEP 1: Chọn ca — grouped by date */}
          {!loading && step === 1 && (
            <div className="space-y-4">
              {Object.keys(shiftsByDate).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">Không có ca nào</p>
                  <p className="text-xs text-muted-foreground mt-1">Bạn không có ca làm trong 2 tuần tới</p>
                </div>
              ) : (
                Object.entries(shiftsByDate).map(([date, shifts]) => {
                  const todayStr = toStr(new Date());
                  const isToday = date === todayStr;
                  const isTomorrow = date === toStr(new Date(Date.now() + 86400000));
                  const dayLabel = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : getDayName(date);

                  return (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {dayLabel}
                        </div>
                        <div className="text-xs text-muted-foreground/60">{fmtDateShort(date)}</div>
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
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                                    </div>
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
                })
              )}
            </div>
          )}

          {/* STEP 2: Loại + người nhận */}
          {!loading && step === 2 && (
            <div className="space-y-5">
              {/* Ca đã chọn — compact */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${getColor(selectedMyShift?.color).dot}`} />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm ${getColor(selectedMyShift?.color).text} truncate`}>
                      {selectedMyShift?.template_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getDayName(selectedMyShift?.date)} {fmtDateShort(selectedMyShift?.date)} • {fmtTime(selectedMyShift?.start_time)} – {fmtTime(selectedMyShift?.end_time)}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setStep(1); setSelectedReceiver(null); setSelectedReceiverShift(null); }}
                  className="text-xs text-primary hover:underline flex-shrink-0 font-medium">
                  Đổi ca
                </button>
              </div>

              {/* Loại đổi ca — with descriptions */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Hình thức</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setSwapType('give_away'); setSelectedReceiverShift(null); }}
                    className={`relative p-3 rounded-xl border text-left transition-all
                      ${swapType === 'give_away'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'hover:bg-muted/50 hover:border-border'}`}
                  >
                    <div className={`text-sm font-semibold ${swapType === 'give_away' ? 'text-primary' : ''}`}>Nhường ca</div>
                    {swapType === 'give_away' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setSwapType('exchange')}
                    className={`relative p-3 rounded-xl border text-left transition-all
                      ${swapType === 'exchange'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'hover:bg-muted/50 hover:border-border'}`}
                  >
                    <div className={`text-sm font-semibold ${swapType === 'exchange' ? 'text-primary' : ''}`}>Đổi ca</div>
                    {swapType === 'exchange' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Chọn đồng nghiệp — with avatars */}
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
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                              Có ca
                            </span>
                          )}
                          {isSelected && <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nếu exchange + có receiver → chọn ca */}
              {swapType === 'exchange' && selectedReceiver && (() => {
                const receiverShifts = selectedReceiver.schedule?.[selectedMyShift?.date] || [];
                if (receiverShifts.length === 0) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm">
                      <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800 dark:text-yellow-300">
                        {selectedReceiver.name} không có ca ngày {fmtDateShort(selectedMyShift?.date)}.
                        Hãy chọn <strong>Nhường ca</strong> hoặc chọn người khác.
                      </span>
                    </div>
                  );
                }
                return (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Chọn ca của {selectedReceiver.name}
                    </div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function BaristaRequests() {
  const [tab, setTab] = useState('received');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    authenticationService.getProfile()
      .then((res) => {
        const user = res?.data?.id ? res.data : res?.data?.data || null;
        if (user?.id) setMyUserId(user.id);
      })
      .catch(() => { });
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await swapRequestService.getMySwapRequests();
      const data = res?.data?.data || res?.data || [];
      setRequests(data);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Filter sorted: pending first
  const filtered = requests
    .filter((r) => {
      if (tab === 'received' && r.receiver.id !== myUserId) return false;
      if (tab === 'sent' && r.requester.id !== myUserId) return false;
      if (filter !== 'all' && r.status !== filter) return false;
      return true;
    })
    .sort((a, b) => {
      // Pending first, then by date desc
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const receivedCount = requests.filter((r) => r.receiver.id === myUserId).length;
  const sentCount = requests.filter((r) => r.requester.id === myUserId).length;
  const pendingReceivedCount = requests.filter((r) => r.receiver.id === myUserId && r.status === 'pending').length;

  const handleAction = async (id, action) => {
    try {
      setActionLoading(true);
      if (action === 'accept') await swapRequestService.acceptSwapRequest(id);
      else if (action === 'reject') await swapRequestService.rejectSwapRequest(id);
      else if (action === 'cancel') await swapRequestService.cancelSwapRequest(id);
      const msgs = { accept: 'Đã chấp nhận đổi ca', reject: 'Đã từ chối', cancel: 'Đã hủy yêu cầu' };
      toast.success(msgs[action]);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đổi ca</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý yêu cầu đổi / nhường ca làm việc</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-2.5 rounded-xl border hover:bg-secondary transition-colors disabled:opacity-50"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo yêu cầu
          </button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          <button
            onClick={() => { setTab('received'); setFilter('all'); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'received' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Inbox className="w-4 h-4" />
            Nhận được
            {pendingReceivedCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                {pendingReceivedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab('sent'); setFilter('all'); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'sent' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Send className="w-4 h-4" />
            Đã gửi
            {sentCount > 0 && <span className="text-xs text-muted-foreground">({sentCount})</span>}
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1 flex-wrap">
          {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            {tab === 'received' ? <Inbox className="w-8 h-8 opacity-30" /> : <Send className="w-8 h-8 opacity-30" />}
          </div>
          <p className="font-semibold text-foreground/70">
            {filter !== 'all' ? `Không có yêu cầu "${STATUS_CONFIG[filter]?.label}"` : 'Không có yêu cầu nào'}
          </p>
          <p className="text-sm mt-1 text-center max-w-xs">
            {tab === 'received'
              ? 'Khi đồng nghiệp muốn đổi / nhường ca cho bạn, yêu cầu sẽ hiện ở đây'
              : 'Nhấn nút "Tạo yêu cầu" để bắt đầu đổi ca với đồng nghiệp'}
          </p>
          {tab === 'sent' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo yêu cầu đổi ca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <SwapRequestCard
              key={r.id}
              req={r}
              myUserId={myUserId}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      <CreateSwapDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchRequests}
        myUserId={myUserId}
      />
    </div>
  );
}
