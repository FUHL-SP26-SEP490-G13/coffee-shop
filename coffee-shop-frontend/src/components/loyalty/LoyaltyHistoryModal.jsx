import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import loyaltyService from "@/services/loyaltyService";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
  Area,
} from "recharts";
import { Coins, Loader2, TrendingDown, TrendingUp, ArrowUpCircle, ArrowDownCircle, History, Sparkles } from "lucide-react";

const TX_LABELS = {
  EARN: "Cộng điểm",
  SPEND: "Dùng điểm",
  REFUND: "Hoàn điểm",
  ADJUST: "Điều chỉnh",
};

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateShort(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function resolveSignedPoints(item) {
  if (Number.isFinite(Number(item?.signed_points))) {
    return Number(item.signed_points);
  }

  const points = Number(item?.points || 0);
  if (String(item?.type || "").toUpperCase() === "SPEND") return -points;
  return points;
}

export default function LoyaltyHistoryModal({ open, onOpenChange, loyaltyPoints = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await loyaltyService.getMyTransactions({ page: 1, limit: 200 });
        const data = Array.isArray(res?.data) ? res.data : [];

        if (!active) return;
        setTransactions(data);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Không thể tải lịch sử điểm. Vui lòng thử lại sau.");
        setTransactions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      active = false;
    };
  }, [open, reloadKey]);

  const { chartData, totalIncreased, totalDecreased } = useMemo(() => {
    const ascending = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let running = 0;
    let increased = 0;
    let decreased = 0;

    const points = ascending.map((item, idx) => {
      const delta = resolveSignedPoints(item);
      running += delta;

      if (delta > 0) increased += delta;
      if (delta < 0) decreased += Math.abs(delta);

      return {
        id: item.id,
        idx: idx + 1,
        label: formatDateShort(item.created_at),
        delta,
        increase: delta > 0 ? delta : 0,
        decrease: delta < 0 ? Math.abs(delta) : 0,
        balance: running,
      };
    });

    return {
      chartData: points,
      totalIncreased: increased,
      totalDecreased: decreased,
    };
  }, [transactions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,780px)] w-[min(96vw,960px)] max-w-[96vw] flex-col overflow-hidden p-0 sm:max-w-4xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/20 dark:border-gray-800 rounded-3xl shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-gray-100 dark:border-gray-800/60 px-5 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 relative overflow-hidden">
          {/* Header Glow */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
             <div className="absolute -top-24 -left-12 w-64 h-64 bg-amber-400/20 rounded-full blur-[60px]" />
             <div className="absolute top-4 right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px]" />
          </div>

          <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold relative z-10 text-gray-900 dark:text-gray-100">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
               <Coins className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            Sổ giao dịch điểm thưởng
          </DialogTitle>
          <DialogDescription className="relative z-10 text-base mt-2 text-gray-500 dark:text-gray-400">
            Báo cáo chi tiết luồng tiền và biến động số dư theo thời gian thực.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 relative layout-body">
          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="group rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-900/30 dark:from-amber-900/20 dark:to-orange-950/20 transition-all hover:-translate-y-1 hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all" />
              <p className="flex items-center justify-between text-sm font-medium text-amber-800 dark:text-amber-500/80 uppercase tracking-widest">
                Đang có
                <Sparkles className="w-4 h-4 text-amber-500" />
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400 drop-shadow-sm">
                {Number(loyaltyPoints || 0).toLocaleString("vi-VN")} <span className="text-xl font-semibold opacity-70">pts</span>
              </p>
            </div>

            <div className="group rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-5 dark:border-emerald-900/30 dark:from-emerald-900/10 dark:to-teal-950/10 transition-all hover:-translate-y-1 hover:shadow-md relative overflow-hidden">
              <p className="flex items-center justify-between text-sm font-medium text-emerald-700/80 dark:text-emerald-500/80 uppercase tracking-widest">
                Tổng nhận
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 drop-shadow-sm">
                +{totalIncreased.toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="group rounded-2xl border border-rose-100/60 bg-gradient-to-br from-rose-50/80 to-pink-50/50 p-5 dark:border-rose-900/30 dark:from-rose-900/10 dark:to-pink-950/10 transition-all hover:-translate-y-1 hover:shadow-md relative overflow-hidden">
              <p className="flex items-center justify-between text-sm font-medium text-rose-700/80 dark:text-rose-500/80 uppercase tracking-widest">
                Đã dùng
                <TrendingDown className="h-4 w-4 text-rose-500" />
              </p>
              <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-500 drop-shadow-sm">
                -{totalDecreased.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Biểu đồ Vùng (Area Chart) */}
          <div className="h-[280px] sm:h-[360px] rounded-3xl border border-gray-100 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/50 p-4 pt-6 pb-2 shadow-sm relative backdrop-blur-xl">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center text-amber-600 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <span className="font-medium">Đang vẽ biểu đồ tài chính...</span>
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-sm">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                   <TrendingDown className="w-6 h-6" />
                </div>
                <span className="text-red-500 font-medium">{error}</span>
                <Button variant="outline" size="sm" onClick={() => setReloadKey((prev) => prev + 1)} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  Tải lại báo cáo
                </Button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <History className="w-10 h-10 mb-3 opacity-30" />
                <span className="py-8 text-center text-sm text-gray-400">Người dùng mới chưa có biến động điểm.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} tickMargin={10} width={60} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.4} />
                  
                  <Tooltip
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', padding: '12px', fontWeight: '500', color: '#374151' }}
                    formatter={(value, name) => {
                      if (name === "delta") {
                        const num = Number(value || 0);
                        const sign = num >= 0 ? "+" : "";
                        return [`${sign}${num.toLocaleString("vi-VN")}`, "Bản ghi giao dịch"];
                      }
                      return [`${Number(value).toLocaleString("vi-VN")} pts`, "Số dư tích lũy"];
                    }}
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                    name="balance"
                  />
                  <Line
                    type="monotone"
                    dataKey="delta"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                    dot={{ r: 1.5, fill: '#0ea5e9', strokeWidth: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    name="delta"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-3xl border border-gray-100 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/50 p-5 shadow-sm backdrop-blur-xl">
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Lịch sử Dòng tiền chi tiết
            </h3>
            
            <div>
              {loading ? (
                <div className="py-10 text-center text-sm text-gray-400 animate-pulse">Đang rà soát dữ liệu giao dịch...</div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Không tìm thấy bản ghi nào.</div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((item) => {
                    const signed = resolveSignedPoints(item);
                    const isPlus = signed >= 0;

                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white dark:bg-gray-950 p-4 border border-gray-100 dark:border-gray-800/80 hover:border-amber-200 hover:shadow-md dark:hover:border-amber-900/50 transition-all gap-3 sm:gap-0"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div className={`mt-0.5 sm:mt-0 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPlus ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}`}>
                             {isPlus ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                          </div>
                          
                          <div className="min-w-0 pr-3">
                            <p className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {TX_LABELS[item.type] || item.type}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                               Dạng: <span className="font-medium text-gray-700 dark:text-gray-300 mx-1">{item.source || "Mặc định"}</span>
                              {item.reference_id ? ` • Mã: #${item.reference_id}` : ""}
                            </p>
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 sm:hidden">
                               {formatDateTime(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-0 border-gray-100 dark:border-gray-800 pt-3 sm:pt-0">
                           <p className="hidden sm:block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
                               {formatDateTime(item.created_at)}
                           </p>
                           <span className={`text-lg font-extrabold ${isPlus ? "text-emerald-600" : "text-rose-600"}`}>
                             {isPlus ? "+" : "-"}
                             {Math.abs(signed).toLocaleString("vi-VN")} <span className="text-sm font-semibold opacity-70">pts</span>
                           </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
