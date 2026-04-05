import { useState } from 'react';
import {
  ArrowLeftRight, ArrowRight, CheckCircle, XCircle, Ban,
  Loader2, ChevronDown, Send, Inbox,
} from 'lucide-react';
import { getColor, STATUS_CONFIG, timeAgo, fmtDate, fmtTime } from './swapHelpers';

// ─── Avatar ──────────────────────────────────────────────────────────────────
function UserAvatar({ name }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
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

// ─── Inline shift info ────────────────────────────────────────────────────────
function ShiftLine({ shift, label }) {
  if (!shift) return null;
  const c = getColor(shift.color);
  const dateStr = shift.date?.slice(0, 10) || shift.date || '';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-1 h-6 rounded-full flex-shrink-0 ${c.dot}`} />
      <div className="min-w-0">
        {label && <div className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">{label}</div>}
        <div className={`font-semibold text-xs ${c.text}`}>{shift.template_name}</div>
        <div className="text-[11px] text-muted-foreground">
          {fmtDate(dateStr)} · {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
        </div>
      </div>
    </div>
  );
}

// ─── SwapRequestCard ─────────────────────────────────────────────────────────
export function SwapRequestCard({ req, myUserId, onAction, actionLoading }) {
  const isSender   = req.requester.id === myUserId;
  const isReceiver = req.receiver.id  === myUserId;
  const isExchange = req.type === 'exchange';
  const isPendingReceived = req.status === 'pending' && isReceiver;
  const isExpired = req.status === 'expired';
  const [expanded, setExpanded] = useState(isPendingReceived);

  const otherPerson = isSender ? req.receiver : req.requester;

  return (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md
      ${isPendingReceived ? 'ring-2 ring-yellow-300 dark:ring-yellow-700' : ''}`}>

      {/* Header row — always visible */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
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
              {isSender
                ? <><Send className="w-3 h-3" /> Bạn gửi</>
                : <><Inbox className="w-3 h-3" /> Gửi cho bạn</>
              }
              <span className="text-muted-foreground/40">•</span>
              {timeAgo(req.created_at)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={req.status} />
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t">
          {/* Shift info */}
          <div className="px-4 py-2">
            {isExchange ? (
              <div className="flex items-center gap-3">
                <ShiftLine shift={req.requester_shift} label={isSender ? 'Ca của bạn' : req.requester.name} />
                <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <ShiftLine shift={req.receiver_shift} label={isReceiver ? 'Ca của bạn' : req.receiver.name} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <ShiftLine shift={req.requester_shift} label={isSender ? 'Ca nhường' : req.requester.name} />
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-1.5">
                  <UserAvatar name={req.receiver.name} />
                  <span className="text-xs font-medium">{isReceiver ? 'Bạn' : req.receiver.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {req.status === 'pending' && (
            <div className="flex gap-2 px-4 py-2 bg-muted/20 border-t">
              {isReceiver && (
                <>
                  <button
                    onClick={() => onAction(req.id, 'accept')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Chấp nhận
                  </button>
                  <button
                    onClick={() => onAction(req.id, 'reject')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Từ chối
                  </button>
                </>
              )}
              {isSender && (
                <button
                  onClick={() => onAction(req.id, 'cancel')}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Hủy yêu cầu
                </button>
              )}
            </div>
          )}

          {/* Timestamp */}
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
