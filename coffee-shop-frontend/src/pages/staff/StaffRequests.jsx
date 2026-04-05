import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, RefreshCw, Send, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import swapRequestService from '../../services/swapRequestService';
import authenticationService from '../../services/authenticationService';
import { SwapRequestCard } from './SwapRequest/SwapRequestCard';
import { CreateSwapDialog } from './SwapRequest/CreateSwapDialog';

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

// ─── Main Page ────────────────────────────────────────────────────────────────
export function StaffRequests() {
  const [tab, setTab] = useState('received');
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [myUserId, setMyUserId] = useState(null);

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
      setRequests(res?.data?.data || res?.data || []);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Reset về trang 1 khi đổi tab
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  const filtered = requests
    .filter((r) => {
      if (tab === 'received' && r.receiver.id !== myUserId) return false;
      if (tab === 'sent' && r.requester.id !== myUserId) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sentCount = requests.filter((r) => r.requester.id === myUserId).length;
  const pendingReceivedCount = requests.filter((r) => r.receiver.id === myUserId && r.status === 'pending').length;

  const handleAction = async (id, action) => {
    try {
      setActionLoading(true);
      if (action === 'accept') await swapRequestService.acceptSwapRequest(id);
      else if (action === 'reject') await swapRequestService.rejectSwapRequest(id);
      else if (action === 'cancel') await swapRequestService.cancelSwapRequest(id);
      toast.success({ accept: 'Đã chấp nhận đổi ca', reject: 'Đã từ chối', cancel: 'Đã hủy yêu cầu' }[action]);
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => handleTabChange('received')}
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
          onClick={() => handleTabChange('sent')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${tab === 'sent' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Send className="w-4 h-4" />
          Đã gửi
          {sentCount > 0 && <span className="text-xs text-muted-foreground">({sentCount})</span>}
        </button>
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
          <p className="font-semibold text-foreground/70">Chưa có yêu cầu nào</p>
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
          {/* Info row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{filtered.length} yêu cầu</span>
            {totalPages > 1 && <span>Trang {page}/{totalPages}</span>}
          </div>

          {/* Cards */}
          {paginated.map((r) => (
            <SwapRequestCard
              key={r.id}
              req={r}
              myUserId={myUserId}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
