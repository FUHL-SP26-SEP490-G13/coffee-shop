import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Send, ChevronLeft, ChevronRight, ChevronDown, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import swapRequestService from '../../../services/swapRequestService';
import { getColor, STATUS_CONFIG, timeAgo, fmtDate, fmtTime } from '../../staff/SwapRequest/swapHelpers';

const PAGE_SIZE = 5;

// ─── Pagination Controls ──────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showEllipsis = totalPages > 7;

  const visiblePages = showEllipsis
    ? pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    : pages;

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {visiblePages.map((p, i) => {
        const prev = visiblePages[i - 1];
        return (
          <div key={p} className="flex items-center gap-1">
            {showEllipsis && prev && p - prev > 1 && (
              <span className="px-1 text-xs text-muted-foreground">…</span>
            )}
            <button
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all
                ${p === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {p}
            </button>
          </div>
        );
      })}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

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

// ─── RoleBadge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (!role) return null;
  const isBarista = role.toLowerCase() === 'barista';
  return (
    <span className={`px-2 py-[2px] rounded text-[9px] uppercase font-bold tracking-wider border ${isBarista
      ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
      : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
      }`}>
      {role}
    </span>
  );
}

// ─── AdminSwapCard ─────────────────────────────────────────────────────────
function AdminSwapCard({ req }) {
  const isExchange = req.type === 'exchange';
  const roleName = req.role || '-';

  return (
    <div className="group rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x border-border">

        {/* NGƯỜI GỬI (BÊN TRÁI) */}
        <div className="flex-1 p-4 bg-muted/10 group-hover:bg-transparent transition-colors flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={req.requester.name} />
              <div>
                <div className="font-semibold text-sm truncate max-w-[150px]">{req.requester.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">Gửi từ</span>
                  <RoleBadge role={roleName} />
                </div>
              </div>
            </div>
          </div>
          <div className="relative bg-background border rounded-lg p-3 shadow-sm h-full flex flex-col justify-center">
            <ShiftLine shift={req.requester_shift} />
          </div>
        </div>

        {/* TRUNG TÂM (TRẠNG THÁI & ACTION) */}
        <div className="relative flex flex-col items-center justify-center p-3 md:min-w-[150px] bg-background md:bg-muted/5 z-0">
          <StatusBadge status={req.status} />
          <div className={`mt-3 px-2 py-1 rounded-full text-[10px] font-bold border flex items-center justify-center gap-1.5 shadow-sm
            ${isExchange
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'}`}>
            {isExchange ? <ArrowLeftRight className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            {isExchange ? 'ĐỔI CA' : 'NHƯỜNG CA'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 font-medium">
            {timeAgo(req.created_at)}
          </div>
        </div>

        {/* NGƯỜI NHẬN (BÊN PHẢI) */}
        <div className="flex-1 p-4 bg-muted/10 group-hover:bg-transparent transition-colors flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={req.receiver.name} />
              <div>
                <div className="font-semibold text-sm truncate max-w-[150px]">{req.receiver.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">Gửi tới</span>
                  <RoleBadge role={roleName} />
                </div>
              </div>
            </div>
          </div>
          <div className="h-full flex flex-col justify-center">
            {isExchange ? (
              <div className="relative bg-background border rounded-lg p-3 shadow-sm">
                <ShiftLine shift={req.receiver_shift} />
              </div>
            ) : (
              <div className="border border-dashed rounded-lg bg-transparent text-center flex flex-col items-center justify-center h-[54px]">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Không nhận lại</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {(req.responded_at || req.expired_at) && (
        <div className="bg-muted/20 px-4 py-2 flex items-center flex-wrap gap-4 text-[10.5px] text-muted-foreground border-t">
          {req.responded_at && (
            <div>Xử lý lúc: <span className="font-semibold text-foreground">{new Date(req.responded_at).toLocaleString('vi-VN')}</span></div>
          )}
          {/* {req.status === 'pending' && req.expired_at && (
            <div>Hết hạn tự động: <span className="font-semibold text-foreground">{new Date(req.expired_at).toLocaleString('vi-VN')}</span></div>
          )} */}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRequests() {
  const [tab, setTab] = useState('all'); // 'all', 'pending', 'resolved'
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await swapRequestService.getAllSwapRequests();
      setRequests(res?.data?.data || res?.data || []);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu đổi ca');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  // Filter requests
  const filtered = requests.filter((r) => {
    if (tab === 'all') return true;
    if (tab === 'pending') return r.status === 'pending';
    if (tab === 'resolved') return r.status !== 'pending';
    return true;
  });

  // Số đếm cho tabs
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const paginated = filtered
    .sort((a, b) => {
      // Pending luôn nổi lên trên Admin
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Tất cả Yêu cầu đổi ca</h1>
          <p className="text-sm text-muted-foreground mt-1">Giám sát hoạt động nhường/đổi ca của nhân viên</p>
        </div>
        <button
          onClick={fetchRequests}
          className="w-10 h-10 rounded-xl border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-muted/40 rounded-xl mb-6 relative z-0 overflow-x-auto hide-scrollbar">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Chờ xử lý', badge: pendingCount },
          { id: 'resolved', label: 'Đã đóng' },
        ].map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 relative flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all min-w-[120px]
                ${isActive ? 'text-foreground shadow-sm bg-background ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu...</div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 rounded-2xl border border-dashed bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ChevronDown className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="font-semibold text-foreground mb-1">Không có dữ liệu</div>
            <div className="text-sm text-muted-foreground text-center max-w-sm">
              Không tìm thấy yêu cầu đổi ca nào cho danh mục này.
            </div>
          </div>
        ) : (
          paginated.map((req) => (
            <AdminSwapCard key={req.id} req={req} />
          ))
        )}
      </div>

      {/* Pagination component */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 border-t pt-4">
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
