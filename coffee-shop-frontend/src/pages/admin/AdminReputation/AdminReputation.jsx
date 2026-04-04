import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  Phone,
  TrendingUp,
  TrendingDown,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import reputationService from "@/services/reputationService";
import receiptSettingService from "@/services/receiptSettingService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PaginationControl from "@/components/common/PaginationControl";

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
};

export default function AdminReputation() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    current_page: 1,
    limit: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  // Cấu hình luật uy tín
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [rules, setRules] = useState([]);

  const handleOpenSettings = async () => {
    setIsSettingsOpen(true);
    setSettingsLoading(true);
    try {
      const res = await receiptSettingService.getSettings();
      let parsedRules = [];
      if (res?.data?.reputation_rules) {
        try {
          let parsed = res.data.reputation_rules;
          if (typeof parsed === 'string') {
             parsed = JSON.parse(parsed);
          }
          if (typeof parsed === 'string') {
             parsed = JSON.parse(parsed);
          }
          if (Array.isArray(parsed)) {
             parsedRules = parsed;
          }
        } catch(e) { console.error("Error parsing rules admin:", e) }
      }
      
      if (!Array.isArray(parsedRules) || parsedRules.length === 0) {
        parsedRules = [
          { id: 1, minScore: 0, maxCash: 0 },
          { id: 2, minScore: 20, maxCash: 30000 },
          { id: 3, minScore: 40, maxCash: 50000 },
          { id: 4, minScore: 60, maxCash: 100000 },
          { id: 5, minScore: 80, maxCash: null }
        ];
      }
      // Khôi phục ID nếu thiếu
      setRules(parsedRules.map(r => ({ ...r, id: r.id || Math.random() })));
    } catch (err) {
      toast.error("Không thể tải cấu hình hạn mức");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      const cleaned = rules.map(r => ({
        ...r,
        minScore: Number(r.minScore) || 0,
        maxCash: r.maxCash === null || r.maxCash === "" ? null : Number(r.maxCash)
      }));

      const sorted = [...cleaned].sort((a, b) => a.minScore - b.minScore);
      if (sorted.length === 0 || sorted[0].minScore !== 0) {
        toast.error("Phải có ít nhất 1 mốc bắt đầu từ 0 điểm");
        setSettingsSaving(false);
        return;
      }
      
      const hasDupes = new Set(sorted.map(r => r.minScore)).size !== sorted.length;
      if (hasDupes) {
        toast.error("Các mốc điểm (Từ X điểm) không được trùng lặp");
        setSettingsSaving(false);
        return;
      }

      await receiptSettingService.upsertSettings({
        reputation_rules: JSON.stringify(sorted.map(r => ({ minScore: r.minScore, maxCash: r.maxCash })))
      });
      toast.success("Lưu cấu hình thành công");
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSettingsSaving(false);
    }
  };

  const addRule = () => {
    setRules(prev => [...prev, { id: Date.now(), minScore: 50, maxCash: 50000 }]);
  };

  const removeRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = (id, field, value) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const fetchProfiles = useCallback(async (currentPage = 1, currentKeyword = "") => {
    try {
      setIsLoading(true);
      setError("");

      const res = await reputationService.getAdminReputationList({
        page: currentPage,
        limit: PAGE_SIZE,
        keyword: currentKeyword,
      });

      const data = res?.data || res?.data?.data || {};
      const items = Array.isArray(data?.items) ? data.items : [];

      setProfiles(items);
      setPagination({
        total: Number(data?.pagination?.total || 0),
        total_pages: Number(data?.pagination?.total_pages || 1),
        current_page: Number(data?.pagination?.current_page || currentPage),
        limit: Number(data?.pagination?.limit || PAGE_SIZE),
      });
    } catch (err) {
      console.error("Lỗi tải danh sách uy tín:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách điểm uy tín");
      setProfiles([]);
      setPagination((prev) => ({ ...prev, total: 0, total_pages: 1 }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProfiles(page, keyword.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [page, keyword, fetchProfiles]);

  const handleOpenHistory = async (profile) => {
    setSelectedProfile(profile);
    setHistoryRows([]);
    setHistoryError("");
    setIsHistoryOpen(true);

    try {
      setHistoryLoading(true);
      const res = await reputationService.getAdminReputationHistory(
        profile.phone_number,
        100,
      );

      const data = res?.data || res?.data?.data || {};
      setHistoryRows(Array.isArray(data?.history) ? data.history : []);
      setSelectedProfile((prev) => ({
        ...(prev || {}),
        current_score:
          Number.isFinite(Number(data?.current_score))
            ? Number(data.current_score)
            : Number(prev?.current_score || 0),
        total_orders_completed: Number(data?.total_orders_completed || prev?.total_orders_completed || 0),
        total_orders_cancelled: Number(data?.total_orders_cancelled || prev?.total_orders_cancelled || 0),
      }));
    } catch (err) {
      console.error("Lỗi tải lịch sử uy tín:", err);
      setHistoryError(err?.response?.data?.message || "Không thể tải lịch sử cộng trừ");
    } finally {
      setHistoryLoading(false);
    }
  };

  const historySummary = useMemo(() => {
    return historyRows.reduce(
      (acc, row) => {
        const change = Number(row?.score_change || 0);
        if (change > 0) acc.plus += change;
        if (change < 0) acc.minus += Math.abs(change);
        return acc;
      },
      { plus: 0, minus: 0 },
    );
  }, [historyRows]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold">Quản lý điểm uy tín</h2>
          </div>
        </div>
        
        <Button onClick={handleOpenSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Cài đặt hạn mức
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => {
            setPage(1);
            setKeyword(event.target.value);
          }}
          className="pl-9"
          placeholder="Tìm theo số điện thoại"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-3 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={() => fetchProfiles(page, keyword.trim())}>
              Tải lại
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-center">STT</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead className="text-center">Điểm hiện tại</TableHead>
                <TableHead className="text-center">Hoàn tất</TableHead>
                <TableHead className="text-center">Đã hủy</TableHead>
                <TableHead className="text-center">Cập nhật</TableHead>
                <TableHead className="text-center w-[120px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Không có dữ liệu điểm uy tín.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile, index) => {
                  const stt = (pagination.current_page - 1) * PAGE_SIZE + index + 1;
                  const score = Number(profile.current_score || 0);

                  return (
                    <TableRow key={profile.phone_number}>
                      <TableCell className="text-center font-medium">{stt}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {profile.phone_number}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold">
                          {score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">
                        {Number(profile.total_orders_completed || 0)}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {Number(profile.total_orders_cancelled || 0)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDateTime(profile.updated_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleOpenHistory(profile)}
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <PaginationControl
        currentPage={pagination.current_page}
        totalPages={pagination.total_pages}
        totalItems={pagination.total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Lịch sử cộng trừ điểm - {selectedProfile?.phone_number || "--"}
            </DialogTitle>
            <DialogDescription>
              Điểm hiện tại: <strong>{Number(selectedProfile?.current_score || 0)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Tổng điểm cộng</p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-emerald-700">
                <TrendingUp className="h-4 w-4" />+{historySummary.plus}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">Tổng điểm trừ</p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-red-700">
                <TrendingDown className="h-4 w-4" />-{historySummary.minus}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-700">Số giao dịch lịch sử</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{historyRows.length}</p>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-lg border">
            {historyLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : historyError ? (
              <p className="p-4 text-sm text-red-600">{historyError}</p>
            ) : historyRows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Chưa có lịch sử cộng trừ cho số điện thoại này.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead className="text-right">Điểm trước</TableHead>
                    <TableHead className="text-right">Thay đổi</TableHead>
                    <TableHead className="text-right">Điểm sau</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((row) => {
                    const change = Number(row.score_change || 0);
                    const isPlus = change > 0;
                    const isMinus = change < 0;
                    const scoreBefore = Number(row.score_before ?? 0);
                    const scoreAfter = Number(row.score_after ?? scoreBefore + change);

                    return (
                      <TableRow key={row.id || `${row.order_id || "no-order"}-${row.happened_at || row.created_at}`}>
                        <TableCell>{formatDateTime(row.happened_at || row.created_at)}</TableCell>
                        <TableCell className="font-medium">
                          {row.order_id ? `#${row.order_id}` : "--"}
                        </TableCell>
                        <TableCell className="text-right">{scoreBefore}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isPlus
                              ? "text-emerald-600"
                              : isMinus
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {isPlus ? "+" : ""}
                          {change}
                        </TableCell>
                        <TableCell className="text-right font-medium">{scoreAfter}</TableCell>
                        <TableCell>
                          <p className="font-medium">{row.reason || "Cập nhật điểm"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.reason_type || "--"}
                            {row.applied_multiplier != null ? ` • x${row.applied_multiplier}` : ""}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cài đặt mốc hạn mức thanh toán</DialogTitle>
            <DialogDescription>
              Thiết lập các giới hạn tiền mặt tối đa dựa trên điểm uy tín của khách hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {settingsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4">
                  <strong>Quy tắc:</strong> Hệ thống sẽ tìm Mốc có điểm yêu cầu cao nhất mà Quý khách đạt được để áp dụng. Bạn bắt buộc phải có 1 dòng quy định mức <strong>Từ 0 điểm trở lên</strong> dành cho người dùng mới. 
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {rules.map((rule, idx) => (
                    <div key={rule.id} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 relative">
                      <div className="flex-1 space-y-1 w-full">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Điều kiện điểm</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Từ</span>
                          <Input 
                            type="number" 
                            min="0" max="100" 
                            value={rule.minScore} 
                            onChange={(e) => updateRule(rule.id, "minScore", e.target.value)}
                            className="w-24 bg-white dark:bg-black"
                          />
                          <span className="text-sm font-medium">trở lên</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-1 w-full">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Giới hạn COD (Tiền mặt)</label>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Nhập số tiền..."
                            value={rule.maxCash === null ? "" : rule.maxCash} 
                            onChange={(e) => updateRule(rule.id, "maxCash", e.target.value)}
                            disabled={rule.maxCash === null}
                            className="bg-white dark:bg-black w-32"
                          />
                          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={rule.maxCash === null}
                              onChange={(e) => updateRule(rule.id, "maxCash", e.target.checked ? null : 0)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Không giới hạn</span>
                          </label>
                        </div>
                      </div>

                      <Button 
                        variant="destructive" size="icon" className="shrink-0 sm:self-end" 
                        onClick={() => removeRule(rule.id)}
                        disabled={rules.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-2" onClick={addRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mốc điểm mới
                </Button>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                    {settingsSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Lưu cấu hình
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
