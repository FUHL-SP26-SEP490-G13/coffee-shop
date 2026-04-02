import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coins,
  Eye,
  Loader2,
  MinusCircle,
  Phone,
  PlusCircle,
  Search,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";

import loyaltyService from "@/services/loyaltyService";
import PaginationControl from "@/components/common/PaginationControl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;
const HISTORY_LIMIT = 100;

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
};

const formatPoints = (value) => Number(value || 0).toLocaleString("vi-VN");

const getSignedPoints = (row) => {
  const signed = Number(row?.signed_points);
  if (Number.isFinite(signed)) return signed;

  const points = Number(row?.points || 0);
  const type = String(row?.type || "").toUpperCase();
  const source = String(row?.source || "").toUpperCase();

  if (type === "SPEND") return -points;
  if (type === "ADJUST" && source.startsWith("ADMIN_DECREASE")) return -points;
  return points;
};

const unwrapResponse = (response) => {
  if (!response) return {};
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    !("success" in response) &&
    !("pagination" in response)
  ) {
    return response.data || {};
  }
  return response;
};

export default function AdminLoyalty() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    current_page: 1,
    limit: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustSource, setAdjustSource] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchCustomers = useCallback(async (currentPage = 1, currentKeyword = "") => {
    try {
      setIsLoading(true);
      setError("");

      const res = await loyaltyService.getAdminCustomerList({
        page: currentPage,
        limit: PAGE_SIZE,
        keyword: currentKeyword,
      });

      const payload = unwrapResponse(res);
      const items = Array.isArray(payload?.data) ? payload.data : [];
      const pager = payload?.pagination || {};

      setCustomers(items);
      setPagination({
        total: Number(pager?.total || 0),
        total_pages: Number(pager?.total_pages || 1),
        current_page: Number(pager?.page || pager?.current_page || currentPage),
        limit: Number(pager?.limit || PAGE_SIZE),
      });
    } catch (err) {
      console.error("Lỗi tải danh sách loyalty:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách điểm loyalty");
      setCustomers([]);
      setPagination((prev) => ({ ...prev, total: 0, total_pages: 1 }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomerDetail = useCallback(async (userId) => {
    const [detailRes, txRes] = await Promise.all([
      loyaltyService.getAdminCustomerDetail(userId),
      loyaltyService.getAdminCustomerTransactions(userId, {
        page: 1,
        limit: HISTORY_LIMIT,
      }),
    ]);

    const detailPayload = unwrapResponse(detailRes);
    const txPayload = unwrapResponse(txRes);
    const detailData = detailPayload?.data || {};
    const txData = txPayload;

    return {
      user: detailData?.user || null,
      loyalty: detailData?.loyalty || null,
      history: Array.isArray(txData?.data) ? txData.data : [],
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers(page, keyword.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [fetchCustomers, page, keyword]);

  const handleOpenDetail = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryRows([]);
    setDetailError("");
    setAdjustPoints("");
    setAdjustSource("");
    setIsDetailOpen(true);

    try {
      setDetailLoading(true);
      const data = await fetchCustomerDetail(customer.id);

      setSelectedCustomer((prev) => ({
        ...(prev || {}),
        ...(data.user || {}),
        ...(data.loyalty || {}),
      }));
      setHistoryRows(data.history);
    } catch (err) {
      console.error("Lỗi tải chi tiết loyalty:", err);
      setDetailError(err?.response?.data?.message || "Không thể tải thông tin chi tiết");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedCustomer?.id) return;

    const delta = Number(adjustPoints);
    if (!Number.isInteger(delta) || delta === 0) {
      toast.error("Số điểm điều chỉnh phải là số nguyên và khác 0");
      return;
    }

    try {
      setAdjustLoading(true);
      await loyaltyService.adjustCustomerPoints(selectedCustomer.id, {
        points: delta,
        source: adjustSource.trim() || undefined,
      });

      toast.success("Điều chỉnh điểm loyalty thành công");
      setAdjustPoints("");
      setAdjustSource("");

      const data = await fetchCustomerDetail(selectedCustomer.id);
      setSelectedCustomer((prev) => ({
        ...(prev || {}),
        ...(data.user || {}),
        ...(data.loyalty || {}),
      }));
      setHistoryRows(data.history);

      await fetchCustomers(page, keyword.trim());
    } catch (err) {
      console.error("Lỗi điều chỉnh điểm loyalty:", err);
      toast.error(err?.response?.data?.message || "Không thể điều chỉnh điểm loyalty");
    } finally {
      setAdjustLoading(false);
    }
  };

  const historySummary = useMemo(() => {
    return historyRows.reduce(
      (acc, row) => {
        const signed = getSignedPoints(row);
        if (signed > 0) acc.plus += signed;
        if (signed < 0) acc.minus += Math.abs(signed);
        return acc;
      },
      { plus: 0, minus: 0 },
    );
  }, [historyRows]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Quản lý điểm loyalty</h2>
            <p className="text-sm text-muted-foreground">
              Theo dõi điểm hiện tại, lịch sử giao dịch và điều chỉnh điểm cho khách hàng.
            </p>
          </div>
        </div>
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
          placeholder="Tìm theo tên, email, số điện thoại"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-3 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={() => fetchCustomers(page, keyword.trim())}>
              Tải lại
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-center">STT</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-center">Điểm hiện tại</TableHead>
                <TableHead className="text-center">Tổng điểm tích lũy</TableHead>
                <TableHead className="text-center">Cập nhật</TableHead>
                <TableHead className="w-[120px] text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Không có dữ liệu loyalty.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => {
                  const stt = (pagination.current_page - 1) * PAGE_SIZE + index + 1;
                  const fullName =
                    `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
                    customer.username ||
                    "Khách hàng";

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="text-center font-medium">{stt}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{fullName}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {customer.phone || "--"}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {customer.email || "--"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold">
                          {formatPoints(customer.total_points)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-amber-700">
                        {formatPoints(customer.lifetime_points)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDateTime(customer.updated_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleOpenDetail(customer)}
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
        itemsPerPage={PAGE_SIZE}
        itemName="khách hàng"
        onPageChange={setPage}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Lịch sử loyalty - {selectedCustomer?.phone || selectedCustomer?.username || "--"}
            </DialogTitle>
            <DialogDescription>
              Điểm hiện tại: <strong>{formatPoints(selectedCustomer?.total_points)}</strong> ({formatPoints(Number(selectedCustomer?.total_points || 0) * 100)} VND)
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Tổng điểm cộng</p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-emerald-700">
                <TrendingUp className="h-4 w-4" />+{formatPoints(historySummary.plus)}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">Tổng điểm trừ</p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-red-700">
                <TrendingDown className="h-4 w-4" />-{formatPoints(historySummary.minus)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-700">Tổng giao dịch</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{historyRows.length}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm font-semibold">Điều chỉnh điểm thủ công</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nhập số nguyên dương để cộng điểm, số âm để trừ điểm. Ví dụ: +20 hoặc -15.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_auto]">
              <Input
                placeholder="Ví dụ: 10 hoặc -5"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
              <Input
                placeholder="Lý do (tự động nếu để trống)"
                value={adjustSource}
                onChange={(e) => setAdjustSource(e.target.value)}
              />
              <Button
                className="gap-2"
                onClick={handleAdjustPoints}
                disabled={adjustLoading || detailLoading}
              >
                {adjustLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : Number(adjustPoints) < 0 ? (
                  <MinusCircle className="h-4 w-4" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Cập nhật điểm
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : detailError ? (
              <p className="p-4 text-sm text-red-600">{detailError}</p>
            ) : historyRows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Chưa có giao dịch loyalty cho khách hàng này.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead className="text-right">Thay đổi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((row) => {
                    const change = getSignedPoints(row);
                    const isPlus = change > 0;
                    const isMinus = change < 0;

                    return (
                      <TableRow key={row.id || `${row.reference_id || "none"}-${row.created_at}`}>
                        <TableCell>{formatDateTime(row.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.type || "--"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{row.source || "--"}</TableCell>
                        <TableCell className="font-medium">
                          {row.reference_id ? `#${row.reference_id}` : "--"}
                        </TableCell>
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
                          {formatPoints(change)}
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
    </div>
  );
}
