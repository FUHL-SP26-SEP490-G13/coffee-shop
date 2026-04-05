import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table as TableIcon,
  Loader2,
  LayoutGrid,
  MapPin,
  ReceiptText,
  ArrowLeftRight,
  MoreVertical,
  GitMerge,
  Clock3,
  HandCoins,
  Wallet,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import tableService from "@/services/tableService";
import areaService from "@/services/areaService";
import orderService from "@/services/orderService";
import { POSModal } from "./POSModal";
import { SplitBillModal } from './SplitBillModal';
import { PaySplitBillModal } from './PaySplitBillModal';
import { ReceiptModal } from "./TakeAwayOrder/ReceiptModal";
import PayOSLogo from "/logo/payOS.svg";
// import ReservationModal from "../admin/AdminTables/ReservationModal";

const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(amount || 0)
  );

const CASH_SUGGESTIONS = [10000, 20000, 50000, 100000, 200000, 500000];

const formatOrderTime = (dateString) => {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "available", label: "Trống" },
  { value: "occupied", label: "Có khách" },
];

function TableCard({
  table,
  onOpenPOS,
  onViewOrder,
  onStatusChange,
  onTransfer,
  onMergeOrder,
  onSeparateBill,
  onRequestPayment,
  activeOrderMeta,
  paymentRequested,
}) {
  const debtAmount = Number(activeOrderMeta?.debt_amount || 0);

  return (
    <Card
      onClick={() => onOpenPOS(table)}
      className="relative group p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:shadow-none bg-card border-border/50 hover:border-primary/50 cursor-pointer overflow-hidden"
    >
      {table.status === "occupied" && (
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={(e) => onViewOrder(e, table)}
            className="p-1.5 rounded-full hover:bg-black/5 text-slate-600 dark:text-slate-300 transition-colors"
            title="Xem đơn hàng"
          >
            <ReceiptText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full hover:bg-black/5 text-slate-600 dark:text-slate-300 transition-colors"
                title="Tùy chọn"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMergeOrder(table);
                }}
              >
                <GitMerge className="w-4 h-4" />
                Ghép đơn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer(table);
                }}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Chuyển bàn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSeparateBill(table);
                }}
              >
                <ReceiptText className="w-4 h-4" />
                Tách đơn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestPayment(table);
                }}
              >
                <HandCoins className="w-4 h-4" />
                Yêu cầu thanh toán
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Status Indicator Bar */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${table.status === "available"
          ? "bg-green-500"
          : table.status === "occupied"
            ? "bg-blue-500"
            : "bg-amber-500"
          }`}
      />

      {/* Table Number Badge */}
      <div
        className={`min-w-[4rem] h-14 px-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${table.status === "available"
          ? "bg-green-50 dark:bg-green-900/30"
          : table.status === "occupied"
            ? "bg-blue-50 dark:bg-blue-900/30"
            : "bg-amber-50 dark:bg-amber-900/30"
          }`}
      >
        <span
          className={`text-xl font-black tracking-tighter whitespace-nowrap ${table.status === "available"
            ? "text-green-700 dark:text-green-400"
            : table.status === "occupied"
              ? "text-blue-700 dark:text-blue-400"
              : "text-amber-700 dark:text-amber-400"
            }`}
        >
          {table.code?.replace("TB-", "")}
        </span>
      </div>

      <div className="text-center space-y-0.5">
        <h3 className="text-sm font-bold text-foreground">Bàn {table.code}</h3>
        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          {table.area_name}
        </p>
        {table.status === "occupied" && (
          <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1 pt-0.5">
            <Clock3 className="w-3 h-3" />
            Order: {formatOrderTime(activeOrderMeta?.created_at || table.updated_at)}
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${table.status === "available"
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200"
          : table.status === "occupied"
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200"
            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
          }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${table.status === "available"
            ? "bg-green-500"
            : table.status === "occupied"
              ? "bg-blue-500"
              : "bg-amber-500"
            }`}
        />
        {table.status === "available"
          ? "Trống"
          : table.status === "occupied"
            ? "Có khách"
            : "Đã đặt"}
      </div>

      {(paymentRequested || debtAmount > 0) && (
        <div className="w-full space-y-1.5">
          {paymentRequested && (
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40/80 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/50 text-center">
              Khách yêu cầu thanh toán
            </div>
          )}
          {debtAmount > 0 && (
            <div className="text-[10px] font-semibold text-red-700 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800/50 text-center">
              Khách phải trả: {formatVND(debtAmount)}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 w-full justify-center mt-1 z-10">
        {table.status === "available" && (
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(table, "occupied");
            }}
          >
            Có khách
          </Button>
        )}
        {table.status === "reserved" && (
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(table, "occupied");
            }}
          >
            Có khách
          </Button>
        )}
        {table.status === "occupied" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(table, "available");
              }}
            >
              Trống
            </Button>

          </>
        )}
      </div>
    </Card>
  );
}


export function StaffTables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Reservation Modal States
  // const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  // const [tableToReserve, setTableToReserve] = useState(null);

  // POS Modal States
  const [selectedTableForPOS, setSelectedTableForPOS] = useState(null);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);

  // Order Modal States
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderModalMode, setOrderModalMode] = useState("view-order");
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [isPaySplitBillModalOpen, setIsPaySplitBillModalOpen] = useState(false);
  const [splitOrderIds, setSplitOrderIds] = useState([]);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedTableToReset, setSelectedTableToReset] = useState(null);
  const [activeOrderSummaries, setActiveOrderSummaries] = useState({});
  const [requestedPaymentByTable, setRequestedPaymentByTable] = useState({});
  const [_nowTick, setNowTick] = useState(Date.now());

  // Transfer Modal States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [tableToTransfer, setTableToTransfer] = useState(null);
  const [transferTargetId, setTransferTargetId] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [transferAreaFilter, setTransferAreaFilter] = useState("all");
  const [tableActionMode, setTableActionMode] = useState("transfer");
  const [activeOrderMetaByTable, setActiveOrderMetaByTable] = useState({});
  const [paymentRequestedByTable, setPaymentRequestedByTable] = useState({});
  const [debtReceiptOrder, setDebtReceiptOrder] = useState(null);
  const [debtPaymentDialog, setDebtPaymentDialog] = useState({
    open: false,
    table: null,
    debtAmount: 0,
    method: "cash",
    cashReceived: "",
    loading: false,
  });

  const debtCashSuggestions = useMemo(() => {
    const debt = Math.max(0, Number(debtPaymentDialog.debtAmount || 0));
    const base = [debt, ...CASH_SUGGESTIONS.filter((v) => v > debt)];
    const roundUp = Math.ceil(debt / 10000) * 10000;
    if (roundUp > 0 && !base.includes(roundUp)) base.splice(1, 0, roundUp);
    return [...new Set(base)].filter((v) => v > 0).slice(0, 4);
  }, [debtPaymentDialog.debtAmount]);

  useEffect(() => {
    const handleDebtPayosReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debtPay") !== "1") return;

      const tableId = Number(params.get("tableId") || 0);
      const status = String(params.get("status") || "").toUpperCase();

      if (!tableId) return;

      if (status === "PAID") {
        try {
          await tableService.settleDebt(tableId, { payment_method: "payos" });
          toast.success("Thanh toán QR thành công");
          setPaymentRequestedByTable((prev) => {
            const next = { ...prev };
            delete next[tableId];
            return next;
          });
          await fetchData();
        } catch (error) {
          const msg =
            error?.response?.data?.message ||
            "Không thể chốt  sau thanh toán QR";
          toast.error(msg);
        }
      } else if (status === "CANCELLED") {
        toast.info("Khách đã hủy giao dịch QR");
      }

      window.history.replaceState({}, "", window.location.pathname);
    };

    handleDebtPayosReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleOpenPOS = (table) => {
    setSelectedTableForPOS(table);
    setIsPOSModalOpen(true);
  };

  const handleOpenTransfer = (table, mode = "transfer") => {
    setTableActionMode(mode);
    setTableToTransfer(table);
    setTransferTargetId(null);
    setTransferAreaFilter("all");
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!tableToTransfer || !transferTargetId) return;
    setTransferring(true);
    try {
      const res =
        tableActionMode === "merge"
          ? await tableService.mergeOrder(tableToTransfer.id, transferTargetId)
          : await tableService.transfer(tableToTransfer.id, transferTargetId);
      toast.success(
        res.message ||
        (tableActionMode === "merge"
          ? "Gộp order thành công!"
          : "Chuyển bàn thành công!")
      );
      setIsTransferModalOpen(false);
      setTableToTransfer(null);
      setTransferTargetId(null);
      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        (tableActionMode === "merge"
          ? "Gộp order thất bại"
          : "Chuyển bàn thất bại")
      );
    } finally {
      setTransferring(false);
    }
  };

  const fetchActiveOrderMeta = async (tableList) => {
    const occupiedTables = tableList.filter((t) => t.status === "occupied");
    if (occupiedTables.length === 0) {
      setActiveOrderMetaByTable({});
      return;
    }

    const results = await Promise.all(
      occupiedTables.map(async (t) => {
        try {
          const res = await tableService.getActiveOrder(t.id);
          const order = res?.data || null;
          if (!order) return [t.id, null];
          return [
            t.id,
            {
              id: order.id,
              created_at: order.created_at,
              is_paid: Number(order.is_paid || 0) === 1,
              payment_status: order.payment_status || "pending",
              debt_amount: Number(order.debt_amount || 0),
              unpaid_orders_count: Number(order.unpaid_orders_count || 0),
            },
          ];
        } catch {
          return [t.id, null];
        }
      })
    );

    const next = {};
    results.forEach(([tableId, meta]) => {
      if (meta) next[tableId] = meta;
    });
    setActiveOrderMetaByTable(next);
  };


  const handleOpenSeparateBill = async (table) => {
    setSelectedTableForOrder(table);
    setLoadingOrder(true);
    try {
      const res = await tableService.getActiveOrder(table.id);
      setActiveOrder(res.data);
      setIsSplitBillModalOpen(true);
    } catch (err) {
      toast.error("Không thể tải thông tin đơn hàng để tách");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleViewOrder = async (e, table) => {
    e.stopPropagation();
    setOrderModalMode("view-order");
    setSelectedTableForOrder(table);
    setIsOrderModalOpen(true);
    setLoadingOrder(true);
    try {
      const res = await tableService.getActiveOrder(table.id);
      setActiveOrder(res.data);
    } catch (err) {
      toast.error("Không thể tải thông tin đơn hàng");
      setActiveOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleOpenPaymentFromRequest = () => {
    const orderId = Number(activeOrder?.unpaid_order_id || activeOrder?.id || 0);
    const tableId = Number(selectedTableForOrder?.id || 0);
    setIsOrderModalOpen(false);
    navigate('/staff/orders', {
      state: {
        focusOrderId: orderId || null,
        focusTableId: tableId || null,
        sourceAction: 'request-payment',
      },
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesRes, areasRes] = await Promise.all([
        tableService.getAll({ status: selectedStatus }),
        areaService.getAll(),
      ]);
      const nextTables = tablesRes.data || [];
      setTables(nextTables);
      setAreas(areasRes.data || []);
      await fetchActiveOrderMeta(nextTables);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // -- TABLE HANDLERS --
  const handleStatusChange = async (table, newStatus) => {
    if (newStatus === "available") {
      const outstandingAmount = Number(activeOrderSummaries[table.id]?.outstanding_amount || 0);
      const hasRequestedPayment = Boolean(requestedPaymentByTable[table.id]);

      if (outstandingAmount > 0 && !hasRequestedPayment) {
        toast.error("Vui lòng bấm 'Yêu cầu thanh toán' trước khi đổi bàn về Trống");
        return;
      }
    }

    try {
      await tableService.update(table.id, { status: newStatus });
      if (newStatus === "available") {
        setPaymentRequestedByTable((prev) => {
          if (!prev[table.id]) return prev;
          const next = { ...prev };
          delete next[table.id];
          return next;
        });
      }
      toast.success("Cập nhật trạng thái thành công");
      setRequestedPaymentByTable((prev) => {
        const next = { ...prev };
        delete next[table.id];
        return next;
      });
      fetchData();
    } catch (error) {
      toast.error(error.message || "Cập nhật thất bại");
    }
  };

  const handleMergeOrder = (table) => {
    toast.info("Chọn bàn đích để ghép order");
    handleOpenTransfer(table, "merge");
  };

  const handleRequestPayment = async (table) => {
    const orderMeta = activeOrderMetaByTable[table.id];
    if (!orderMeta) {
      toast.error("Bàn này chưa có đơn để yêu cầu thanh toán");
      return;
    }
    const debtAmount = Number(orderMeta.debt_amount || 0);
    if (debtAmount <= 0) {
      toast.info("Bàn này hiện không có đơn hàng cần thanh toán");
      return;
    }

    setPaymentRequestedByTable((prev) => ({
      ...prev,
      [table.id]: {
        requested_at: new Date().toISOString(),
        debt_amount: debtAmount,
      },
    }));
    toast.success(`Số tiền khách phải trả cho bàn ${table.code} (${formatVND(debtAmount)})`);
    handleOpenDebtPayment(table, debtAmount);
  };

  const handleOpenDebtPayment = (table, debtAmount) => {
    setDebtPaymentDialog({
      open: true,
      table,
      debtAmount: Number(debtAmount || 0),
      method: "cash",
      cashReceived: String(Number(debtAmount || 0)),
      loading: false,
    });
  };

  const buildDebtReceiptOrder = async ({
    table,
    paymentMethod,
    cashReceived = 0,
    fallbackAmount = 0,
    orderId = null,
  }) => {
    const unpaidRes = await tableService.getUnpaidOrders(table.id);
    let unpaidOrders = unpaidRes?.data || [];

    if (orderId) {
      unpaidOrders = unpaidOrders.filter((o) => Number(o.id) === Number(orderId));
    }

    const detailedOrders = await Promise.all(
      unpaidOrders.map(async (order) => {
        try {
          const detailRes = await orderService.getOrderDetailForStaff(order.id);
          return detailRes?.data || null;
        } catch {
          return null;
        }
      })
    );

    const validOrders = detailedOrders.filter(Boolean);
    const orderIds = (validOrders.length > 0 ? validOrders : unpaidOrders)
      .map((order) => Number(order.id || 0))
      .filter((id) => id > 0);

    if (orderIds.length === 0) {
      throw new Error("Không lấy được mã đơn hàng");
    }

    const orderCodeText =
      orderIds.length > 0
        ? orderIds.length === 1
          ? `#${orderIds[0]}`
          : orderIds.map((id) => `#${id}`).join(", ")
        : orderId
          ? `#${Number(orderId)}`
          : "#N/A";

    let items = validOrders.flatMap((order) =>
      (order.items || []).map((item) => ({
        product_name: item.name || item.product_name || "",
        size: item.size || "M",
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.price || item.unit_price || 0),
        toppings: (item.toppings || []).map((t) => ({
          name: t.name,
          quantity: Number(t.quantity || 0),
          price: Number(t.price || 0),
        })),
        note: item.note || "",
      }))
    );

    const totalAmountFromOrders = validOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );
    const totalAmount = Number(totalAmountFromOrders || fallbackAmount || 0);
    items = items.filter((item) => item.product_name && item.quantity > 0 && item.unit_price >= 0);

    if (items.length === 0) {
      throw new Error("Không lấy được tên sản phẩm đã bán");
    }

    return {
      order_id: orderIds[0] || Number(orderId || Date.now()),
      order_code: orderCodeText,
      created_at: new Date().toISOString(),
      order_type: "dine-in",
      receiver_name: `Khách bàn ${table.code || table.id}`,
      payment_method: paymentMethod,
      items,
      total_amount: totalAmount,
      payment: {
        method: paymentMethod,
        status: "paid",
        cash_received: paymentMethod === "cash" ? Number(cashReceived || 0) : undefined,
        change_amount:
          paymentMethod === "cash"
            ? Math.max(0, Number(cashReceived || 0) - Number(totalAmount || 0))
            : undefined,
      },
    };
  };

  const handleSettleDebt = async () => {
    if (!debtPaymentDialog.table) return;
    const selectedTable = debtPaymentDialog.table;

    const debtAmount = Number(debtPaymentDialog.debtAmount || 0);
    if (debtAmount <= 0) {
      toast.error("Không có số tiền để thanh toán");
      return;
    }



    setDebtPaymentDialog((prev) => ({ ...prev, loading: true }));

    if (debtPaymentDialog.method === "payos") {
      try {
        const receiptForPayos = await buildDebtReceiptOrder({
          table: selectedTable,
          paymentMethod: "payos",
          fallbackAmount: debtAmount,
        });

        const payosItems = (receiptForPayos.items || [])
          .map((item) => ({
            name: String(item.product_name || "").slice(0, 100),
            quantity: Math.max(1, Number(item.quantity || 1)),
            price: Math.round(Number(item.unit_price || item.price || 0)),
          }))
          .filter((item) => item.name && item.price > 0);

        if (payosItems.length === 0) {
          setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
          toast.error("Không lấy được sản phẩm đã bán để tạo thanh toán");
          return;
        }

        const now = Date.now();
        const orderCode = Number(String(now).slice(-6));
        const transferOrderId = Number(receiptForPayos.order_id || 0);
        if (!transferOrderId) {
          setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
          toast.error("Không lấy được mã id đơn để tạo thanh toán");
          return;
        }
        const transferDescription = `DH${transferOrderId}`.slice(0, 25);
        const payosReturnParams = new URLSearchParams({
          origin: "/staff/tables",
          debtPay: "1",
          tableId: String(selectedTable.id),
          tableCode: String(selectedTable.code || ""),
          debtAmount: String(Math.round(debtAmount)),
        });
        const returnUrl = `${window.location.origin}/staff/payment-result?${payosReturnParams.toString()}`;

        const createRes = await orderService.createPaymentLink({
          orderCode,
          amount: Math.round(debtAmount),
          description: transferDescription,
          items: payosItems,
          returnUrl,
          cancelUrl: returnUrl,
        });

        const checkoutUrl = createRes?.data?.checkoutUrl;
        if (!checkoutUrl) {
          setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
          toast.error("Không tạo được link thanh toán QR");
          return;
        }

        window.location.href = checkoutUrl;
        return;
      } catch (error) {
        toast.error(error?.response?.data?.message || "Không tạo được QR PayOS");
        setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
        return;
      }
    }

    const cashReceived = Number(debtPaymentDialog.cashReceived || 0);
    if (Number.isNaN(cashReceived) || cashReceived < debtAmount) {
      setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
      toast.error("Tiền khách đưa không đủ");
      return;
    }

    let receiptOrderDraft = null;
    try {
      receiptOrderDraft = await buildDebtReceiptOrder({
        table: selectedTable,
        paymentMethod: "cash",
        cashReceived,
        fallbackAmount: debtAmount,
      });
    } catch (error) {
      setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
      toast.error(error?.message || "Không lấy được thông tin đơn hàng");
      return;
    }

    try {
      const res = await tableService.settleDebt(selectedTable.id, {
        payment_method: debtPaymentDialog.method,
        cash_received: cashReceived,
      });

      toast.success(res?.message || "Thanh toán  thành công");
      setDebtPaymentDialog({
        open: false,
        table: null,
        debtAmount: 0,
        method: "cash",
        cashReceived: "",
        loading: false,
      });
      setPaymentRequestedByTable((prev) => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });

      setDebtReceiptOrder(receiptOrderDraft);

      await fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thanh toán được ");
      setDebtPaymentDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // const handleReserveTable = (table) => {
  //   setTableToReserve(table);
  //   setIsReservationModalOpen(true);
  // };

  const filteredTables = tables.filter(
    (table) => selectedAreaId === "all" || table.area_id.toString() === selectedAreaId
  );

  const currentAreaObj = areas.find((a) => a.id.toString() === selectedAreaId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Theo dõi & Đặt Bàn</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* FILTERS + TABS FOR AREAS AND TABLES GRID */}
      <Tabs
        value={selectedAreaId}
        onValueChange={setSelectedAreaId}
        className="w-full"
      >
        <div className="overflow-x-auto pb-2 mb-4">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-muted p-1 text-slate-700 dark:text-slate-200">
            <TabsTrigger value="all" className="px-4 py-2">
              Tất cả khu vực
            </TabsTrigger>
            {areas.map((area) => (
              <TabsTrigger
                key={area.id}
                value={area.id.toString()}
                className="px-4 py-2"
              >
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* STATUS FILTERS & STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-4 lg:col-span-3 bg-white dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">Lọc trạng thái:</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTER_OPTIONS.map((option) => {
                  const isActive = selectedStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-slate-700 dark:text-slate-200 border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-center bg-primary/5 border-primary/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Tổng số bàn:
              </span>
              <span className="font-bold text-primary">
                {filteredTables.length}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Đang trống:
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {filteredTables.filter((t) => t.status === "available").length}
              </span>
            </div>
          </Card>
        </div>

        <TabsContent value={selectedAreaId} className="mt-0">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-slate-600 dark:text-slate-300">Đang tải...</p>
            </div>
          ) : selectedAreaId === "all" ? (
            /* === ALL AREAS: Grouped by area === */
            <div className="space-y-8">
              {filteredTables.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4 bg-muted/30 rounded-3xl border-2 border-dashed">
                  <TableIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                    Không tìm thấy bàn nào phù hợp
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAreaId("all");
                      setSelectedStatus("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : (
                areas.map((area) => {
                  const areaTables = filteredTables.filter(
                    (t) => t.area_id.toString() === area.id.toString()
                  );
                  if (areaTables.length === 0) return null;
                  const availableCount = areaTables.filter((t) => t.status === "available").length;
                  const occupiedCount = areaTables.filter((t) => t.status === "occupied").length;
                  return (
                    <div key={area.id}>
                      {/* Area Header */}
                      <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-4 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted border flex-shrink-0 flex items-center justify-center">
                            {area.image ? (
                              <img
                                src={area.image}
                                alt={area.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MapPin className="w-4 h-4 opacity-70 text-slate-600 dark:text-slate-300" />
                            )}
                          </div>
                          <div>
                            <h2 className="font-bold text-base text-foreground">{area.name}</h2>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{areaTables.length} bàn</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            {availableCount} trống
                          </span>
                          <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                            {occupiedCount} có khách
                          </span>
                        </div>
                      </div>

                      {/* Tables Grid for this area */}
                      <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-4">
                        {areaTables.map((table) => (
                          <TableCard
                            key={table.id}
                            table={table}
                            onOpenPOS={handleOpenPOS}
                            onViewOrder={handleViewOrder}
                            onStatusChange={handleStatusChange}
                            onTransfer={handleOpenTransfer}
                            onMergeOrder={handleMergeOrder}
                            onSeparateBill={handleOpenSeparateBill}
                            onRequestPayment={handleRequestPayment}
                            activeOrderMeta={activeOrderMetaByTable[table.id]}
                            paymentRequested={Boolean(paymentRequestedByTable[table.id])}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* === SPECIFIC AREA === */
            <div className="space-y-6">
              {/* Area Info Banner */}
              {currentAreaObj && (
                <div className="flex items-center justify-between bg-card border rounded-xl p-4 mb-6 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border flex-shrink-0 flex items-center justify-center">
                      {currentAreaObj.image ? (
                        <img
                          src={currentAreaObj.image}
                          alt={currentAreaObj.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin className="w-6 h-6 opacity-70 text-slate-600 dark:text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{currentAreaObj.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {filteredTables.length} bàn trong khu vực này
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {filteredTables.filter((t) => t.status === "available").length} trống
                    </span>
                    <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      {filteredTables.filter((t) => t.status === "occupied").length} có khách
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-4">
                {filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onOpenPOS={handleOpenPOS}
                      onViewOrder={handleViewOrder}
                      onStatusChange={handleStatusChange}
                      onTransfer={handleOpenTransfer}
                      onMergeOrder={handleMergeOrder}
                      onSeparateBill={handleOpenSeparateBill}
                      onRequestPayment={handleRequestPayment}
                      activeOrderMeta={activeOrderMetaByTable[table.id]}
                      paymentRequested={Boolean(paymentRequestedByTable[table.id])}
                    />
                  ))
                ) : (
                  <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 bg-muted/30 rounded-3xl border-2 border-dashed">
                    <TableIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                      Không tìm thấy bàn nào phù hợp
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAreaId("all");
                        setSelectedStatus("all");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </div>

            </div>
          )}

        </TabsContent>
      </Tabs>

      {/* <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        table={tableToReserve}
        onSuccess={fetchData}
      /> */}

      {/* POS Modal */}
      <POSModal
        isOpen={isPOSModalOpen}
        onClose={() => {
          setIsPOSModalOpen(false);
          setSelectedTableForPOS(null);
          fetchData();
        }}
        table={selectedTableForPOS}
        onTableStatusChange={(tableId, newStatus) => {
          setTables((prev) =>
            prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
          );
        }}
      />

      {/* Transfer Table Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={(open) => { if (!open) { setIsTransferModalOpen(false); setTableToTransfer(null); setTransferTargetId(null); setTableActionMode("transfer"); } }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              {tableActionMode === "merge" ? "Ghép order" : "Chuyển bàn"} {tableToTransfer ? `— Bàn ${tableToTransfer.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* From table info */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-lg px-3 py-2">
                {tableToTransfer?.code}
              </div>
              <div>
                <p className="text-sm font-medium">Bàn hiện tại</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {tableToTransfer?.area_name}
                  {tableActionMode === "merge" ? " · Nguồn" : ""}
                </p>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-slate-600 dark:text-slate-300 mx-auto" />
              <div className="flex-1 text-right">
                {transferTargetId ? (() => {
                  const t = tables.find(x => x.id === transferTargetId);
                  return t ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{t.code}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t.area_name}</span>
                    </div>
                  ) : null;
                })() : (
                  <span className="text-xs text-slate-600 dark:text-slate-300 italic">Chưa chọn bàn đích</span>
                )}
              </div>
            </div>

            {/* Filter by area */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium shrink-0">Khu vực:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTransferAreaFilter("all")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${transferAreaFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-border text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                    }`}
                >
                  Tất cả
                </button>
                {areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setTransferAreaFilter(a.id.toString())}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${transferAreaFilter === a.id.toString()
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-border text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                      }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination tables grid */}
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {tables
                .filter(
                  (t) =>
                    t.id !== tableToTransfer?.id &&
                    (tableActionMode === "merge" || t.status === "available") &&
                    (transferAreaFilter === "all" || t.area_id.toString() === transferAreaFilter)
                )
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTransferTargetId(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${transferTargetId === t.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-border hover:border-indigo-300 bg-card"
                      }`}
                  >
                    <span className={`text-base font-black ${transferTargetId === t.id ? "text-indigo-700" : "text-foreground"
                      }`}>
                      {t.code?.replace("TB-", "")}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 text-center leading-tight">
                      {t.area_name} {tableActionMode === "merge" && t.status === "occupied" ? "· Có khách" : ""}
                    </span>
                  </button>
                ))}
              {tables.filter(
                (t) =>
                  t.id !== tableToTransfer?.id &&
                  (tableActionMode === "merge" || t.status === "available") &&
                  (transferAreaFilter === "all" || t.area_id.toString() === transferAreaFilter)
              ).length === 0 && (
                  <div className="col-span-4 py-8 text-center text-slate-600 dark:text-slate-300 text-sm">
                    {tableActionMode === "merge" ? "Không có bàn phù hợp" : "Không có bàn trống nào"}
                  </div>
                )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)} disabled={transferring}>
              Hủy
            </Button>
            <Button
              disabled={!transferTargetId || transferring}
              onClick={handleConfirmTransfer}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {transferring ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tableActionMode === "merge" ? "Đang gộp..." : "Đang chuyển..."}</>
              ) : (
                <><ArrowLeftRight className="w-4 h-4 mr-2" />{tableActionMode === "merge" ? "Xác nhận ghép order" : "Xác nhận chuyển bàn"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Order Info Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={(open) => {
        setIsOrderModalOpen(open);
        if (!open) {
          setOrderModalMode("view-order");
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Đơn hàng - {selectedTableForOrder ? `Bàn ${selectedTableForOrder.code}` : ''}</DialogTitle>
          </DialogHeader>
          {loadingOrder ? (
            <div className="py-8 flex justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activeOrder ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold text-lg">Mã đơn: #{activeOrder.id}</span>
                <span className="text-slate-600 dark:text-slate-300 text-sm">{new Date(activeOrder.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="space-y-4">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-base">{item.quantity} x {item.name}</p>
                      <p className="text-slate-600 dark:text-slate-300">Size {item.size}</p>
                      {item.toppings?.length > 0 && (
                        <div className="mt-1 pl-2 border-l-2 border-muted space-y-1">
                          {item.toppings.map((t, tidx) => (
                            <p key={tidx} className="text-xs text-slate-600 dark:text-slate-300">
                              + {t.name} (x{t.quantity})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-medium whitespace-nowrap ml-4 mt-1">
                      {parseInt(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-primary">
                  {parseInt(
                    orderModalMode === "request-payment"
                      ? (activeOrder.outstanding_amount || activeOrder.total_amount || 0)
                      : (activeOrder.total_amount || 0)
                  ).toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="flex w-full gap-2 mt-4">
              
             
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-600 dark:text-slate-300">
              <ReceiptText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có đơn hàng nào cho bàn này</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Debt Payment Modal */}
      <Dialog
        open={debtPaymentDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDebtPaymentDialog({
              open: false,
              table: null,
              debtAmount: 0,
              method: "cash",
              cashReceived: "",
              loading: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              Thanh toán  - {debtPaymentDialog.table ? `Bàn ${debtPaymentDialog.table.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-200">Khách cần trả ()</span>
                <span className="text-xl font-bold text-orange-500">{formatVND(debtPaymentDialog.debtAmount)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-2">PHƯƠNG THỨC THANH TOÁN</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDebtPaymentDialog((prev) => ({ ...prev, method: "cash" }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${debtPaymentDialog.method === "cash"
                    ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30/50"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                >
                  <Wallet className="w-4 h-4" /> Tiền mặt
                </button>
                <button
                  onClick={() => setDebtPaymentDialog((prev) => ({ ...prev, method: "payos" }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${debtPaymentDialog.method === "payos"
                    ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30/50"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                >
                  <img src={PayOSLogo} alt="PayOS" className="h-8 w-8" />
                  QR PayOS
                </button>
              </div>
            </div>

            {debtPaymentDialog.method === "cash" && (
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">TIỀN KHÁCH ĐƯA</label>
                <Input
                  type="number"
                  value={debtPaymentDialog.cashReceived}
                  onChange={(e) =>
                    setDebtPaymentDialog((prev) => ({ ...prev, cashReceived: e.target.value }))
                  }
                  className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-lg font-bold"
                />
                <div className="flex gap-2 mt-3">
                  {debtCashSuggestions.map((val) => {
                    const selected = Number(debtPaymentDialog.cashReceived || 0) === val;
                    return (
                      <button
                        key={val}
                        onClick={() =>
                          setDebtPaymentDialog((prev) => ({
                            ...prev,
                            cashReceived: String(val),
                          }))
                        }
                        className={`flex-1 p-2 rounded-full border text-sm font-medium transition-all ${selected
                          ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50"
                          }`}
                      >
                        {formatVND(val).replace(/\s?₫/, "").trim()}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2 flex justify-between items-center">
                  <span>Tiền thừa trả khách</span>
                  <span className="font-bold">
                    {formatVND(
                      Math.max(
                        0,
                        Number(debtPaymentDialog.cashReceived || 0) - Number(debtPaymentDialog.debtAmount || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
            )}



            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setDebtPaymentDialog({
                    open: false,
                    table: null,
                    debtAmount: 0,
                    method: "cash",
                    cashReceived: "",
                    loading: false,
                  })
                }
                disabled={debtPaymentDialog.loading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSettleDebt}
                disabled={debtPaymentDialog.loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {debtPaymentDialog.loading
                  ? "Đang xử lý..."
                  : debtPaymentDialog.method === "payos"
                    ? "Tạo QR thanh toán"
                    : "Xác nhận thanh toán"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitBillModal
        isOpen={isSplitBillModalOpen}
        onClose={() => setIsSplitBillModalOpen(false)}
        table={selectedTableForOrder}
        activeOrder={activeOrder}
        onSplitSuccess={() => {
          setIsPaySplitBillModalOpen(true);
          fetchData();
        }}
      />

      {isPaySplitBillModalOpen && (
        <PaySplitBillModal
          isOpen={isPaySplitBillModalOpen}
          onClose={() => setIsPaySplitBillModalOpen(false)}
          table={selectedTableForOrder}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {debtReceiptOrder && (
        <ReceiptModal
          order={debtReceiptOrder}
          onClose={() => setDebtReceiptOrder(null)}
        />
      )}

    </div>
  );
}
