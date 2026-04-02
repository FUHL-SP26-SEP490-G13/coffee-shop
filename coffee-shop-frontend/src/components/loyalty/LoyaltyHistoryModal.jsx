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
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
} from "recharts";
import { Coins, Loader2, TrendingDown, TrendingUp } from "lucide-react";

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
  return date.toLocaleString("vi-VN");
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
        setError(err?.response?.data?.message || "Không thể tải lịch sử loyalty");
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
      <DialogContent className="flex h-[min(92vh,760px)] w-[min(96vw,960px)] max-w-[96vw] flex-col overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            Lịch sử điểm loyalty
          </DialogTitle>
          <DialogDescription>
            Theo dõi biến động điểm cộng/trừ của tài khoản hiện tại.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4 dark:bg-gray-900">
              <p className="text-xs text-gray-500">Điểm hiện tại</p>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
                {Number(loyaltyPoints || 0).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 dark:bg-gray-900">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Tổng cộng
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                +{totalIncreased.toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4 dark:bg-gray-900">
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingDown className="h-3.5 w-3.5 text-rose-600" /> Tổng trừ
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-600">
                -{totalDecreased.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="h-[240px] rounded-xl border bg-white p-3 sm:h-[320px] dark:bg-gray-900">
            {loading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải biểu đồ...
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-500">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => setReloadKey((prev) => prev + 1)}>
                  Thử lại
                </Button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Chưa có dữ liệu giao dịch điểm.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "delta") {
                        const num = Number(value || 0);
                        const sign = num >= 0 ? "+" : "";
                        return [`${sign}${num.toLocaleString("vi-VN")}`, "Biến động"];
                      }
                      return [Number(value).toLocaleString("vi-VN"), "Số dư"];
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      if (value === "delta") return "Biến động theo giao dịch";
                      return "Số dư tích lũy";
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="delta"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border bg-white p-3 dark:bg-gray-900">
            <p className="mb-2 text-sm font-semibold">Chi tiết giao dịch</p>
            <div>
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
              ) : transactions.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">Chưa có giao dịch điểm.</div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((item) => {
                    const signed = resolveSignedPoints(item);
                    const isPlus = signed >= 0;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="break-words font-medium text-gray-800 dark:text-gray-200">
                            {TX_LABELS[item.type] || item.type} · {item.source}
                          </p>
                          <p className="break-words text-xs text-gray-500">
                            {formatDateTime(item.created_at)}
                            {item.reference_id ? ` · Ref #${item.reference_id}` : ""}
                          </p>
                        </div>
                        <span className={isPlus ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                          {isPlus ? "+" : "-"}
                          {Math.abs(signed).toLocaleString("vi-VN")}
                        </span>
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
