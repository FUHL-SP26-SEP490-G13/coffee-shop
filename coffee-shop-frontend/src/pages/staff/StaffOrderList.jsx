import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Truck,
  Bell,
  Printer,
  Coffee,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import socket from "@/lib/socket";
import baristaDBService from "@/services/baristaDBService";
import orderOnlineService from "@/services/orderOnlineService";
import authenticationService from "@/services/authenticationService";
import takeawayService from "@/services/takeAwayService";
import { ReceiptModal } from "./TakeAwayOrder/ReceiptModal";

const STAFF_TAB_STATUSES = [
  "pending",
  "preparing",
  "completed",
  "cancelled",
];

const statusLabelMap = {
  pending: "Đang chờ",
  preparing: "Đang chuẩn bị",
  completed: "Thành công",
  cancelled: "Hủy",
};

const statusClassMap = {
  pending: "bg-slate-100 text-slate-700",
  preparing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const orderTypeLabelMap = {
  all: "Tất cả",
  delivery: "Đơn giao hàng",
  "dine-in": "Tại bàn",
  takeaway: "Mang về",
};

const ORDER_TYPE_COLUMNS = [
  { key: "delivery", label: "Đơn giao hàng", icon: Truck },
  { key: "dine-in", label: "Đơn tại bàn", icon: Coffee },
  { key: "takeaway", label: "Đơn mang đi", icon: ShoppingBag },
];

const STATUS_KANBAN_COLUMNS = [
  { key: "pending", label: "Đang chờ" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Hủy" },
];

const normalizeOrderType = (value) => {
  const type = String(value || "").toLowerCase();
  if (type === "dinein") return "dine-in";
  if (type === "take-away") return "takeaway";
  if (type === "dine-in" || type === "delivery" || type === "takeaway") {
    return type;
  }
  return type;
};

const getOrderTypeLabel = (value) => {
  const type = normalizeOrderType(value);
  return orderTypeLabelMap[type] || type || "--";
};

const getOrderTypeBadgeMeta = (value) => {
  const type = normalizeOrderType(value);

  if (type === "dine-in") {
    return {
      label: "Tại bàn",
      icon: "🍽",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (type === "takeaway") {
    return {
      label: "Mang đi",
      icon: "🥤",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Online",
    icon: "🚚",
    className: "bg-blue-100 text-blue-700",
  };
};

const isDeliveryOrder = (order) =>
  normalizeOrderType(order?.order_type) === "delivery";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " đ";

const getDisplayName = (user) => {
  const firstName = String(user?.first_name || "").trim();
  const lastName = String(user?.last_name || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user?.username || user?.email || "Nhân viên";
};

const isOrderPaid = (order) => {
  const paymentStatus = String(
    order?.payment_status || order?.payment?.status || "",
  ).toLowerCase();
  if (paymentStatus === "paid") return true;

  return (
    order?.is_paid === true || order?.is_paid === 1 || order?.is_paid === "1"
  );
};

const getElapsedMinutes = (value) => {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;

  const diffMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

const getRelativeTimeLabel = (value) => {
  const minutes = getElapsedMinutes(value);
  if (minutes <= 0) return "Vừa xong";
  return `${minutes} phút trước`;
};

const getPaymentMethodLabel = (order) => {
  const method = String(
    order?.payment_method || order?.paymentMethod || order?.payment?.method || "",
  ).toLowerCase();

  if (method === "payos") return "PayOS";
  if (method === "cash") return "Tiền mặt";
  return "--";
};

export function OrderDelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false,
    orderId: null,
    mode: "pending",
  });
  const [completingId, setCompletingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cardPendingActions, setCardPendingActions] = useState({});
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showCompletedColumn, setShowCompletedColumn] = useState(false);
  const [showCancelledColumn, setShowCancelledColumn] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [cashPaymentDialog, setCashPaymentDialog] = useState({
    open: false,
    order: null,
    cashReceived: "",
  });
  const [printerName, setPrinterName] = useState("Nhân viên");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baristaDBService.getActiveOrders(STAFF_TAB_STATUSES);
      const list = res?.data?.data || res?.data || [];

      const activeOrders = (Array.isArray(list) ? list : [])
        .filter((order) => STAFF_TAB_STATUSES.includes(order?.status))
        .sort((a, b) => {
          const createdDiff =
            new Date(a?.created_at || 0).getTime() -
            new Date(b?.created_at || 0).getTime();

          if (createdDiff !== 0) return createdDiff;
          return Number(a?.id || 0) - Number(b?.id || 0);
        });

      setOrders(activeOrders);
    } catch (error) {
      toast.error("Không tải được danh sách Order List");
      console.error("Load order list failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authenticationService.getProfile();
        const user = res?.data?.id ? res.data : res?.data?.data || res?.data;
        setPrinterName(getDisplayName(user));
      } catch {
        setPrinterName("Nhân viên");
      }
    };

    loadProfile();
  }, []);

  // Socket listener for new online orders (delivery + takeaway)
  useEffect(() => {
    const notifyAndReload = (label, data) => {
      setNewOrderCount((prev) => prev + 1);
      toast.success(`🔔 Có đơn ${label} mới! (#${data.order_id})`);
      loadOrders();
    };

    const handleNewDeliveryOrder = (data) =>
      notifyAndReload("giao hàng", data);

    const handleNewTakeawayOrder = (data) =>
      notifyAndReload("mang đi", data);

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("new-delivery-order", handleNewDeliveryOrder);
    socket.on("new-takeaway-order", handleNewTakeawayOrder);

    return () => {
      socket.off("new-delivery-order", handleNewDeliveryOrder);
      socket.off("new-takeaway-order", handleNewTakeawayOrder);
    };
  }, [loadOrders]);

  const orderTypeCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.all += 1;
        const type = normalizeOrderType(order?.order_type);
        if (type in acc) {
          acc[type] += 1;
        }
        return acc;
      },
      { all: 0, delivery: 0, "dine-in": 0, takeaway: 0 },
    );
  }, [orders]);

  const counts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const status = order?.status;
        if (STAFF_TAB_STATUSES.includes(status)) {
          acc[status] += 1;
        }
        return acc;
      },
      { pending: 0, preparing: 0, completed: 0, cancelled: 0 },
    );
  }, [orders]);

  const delayedOrdersCount = useMemo(() => {
    return orders.filter((order) => {
      if (!["pending", "preparing"].includes(order?.status)) return false;
      return getElapsedMinutes(order?.created_at) > 10;
    }).length;
  }, [orders]);

  const groupedOrdersByStatus = useMemo(() => {
    const grouped = orders.reduce(
      (acc, order) => {
        const status = order?.status;
        if (status in acc) {
          acc[status].push(order);
        }
        return acc;
      },
      { pending: [], preparing: [], completed: [], cancelled: [] },
    );

    const toTime = (order) => new Date(order?.created_at || 0).getTime();

    grouped.pending.sort((a, b) => toTime(a) - toTime(b));
    grouped.preparing.sort((a, b) => toTime(a) - toTime(b));
    grouped.completed.sort((a, b) => toTime(b) - toTime(a));
    grouped.cancelled.sort((a, b) => toTime(b) - toTime(a));

    return grouped;
  }, [orders]);

  const visibleStatusColumns = useMemo(() => {
    return STATUS_KANBAN_COLUMNS.filter((column) => {
      if (column.key === "completed") return showCompletedColumn;
      if (column.key === "cancelled") return showCancelledColumn;
      return true;
    });
  }, [showCompletedColumn, showCancelledColumn]);

  const handleConfirmOrder = async (order) => {
    setConfirmingId(order.id);
    try {
      await orderOnlineService.confirmPreparing(order.id);
      if (Number(order.is_paid) === 0) {
        toast.success(
          "Đã xác nhận với khách hàng, chuyển đơn sang đang chuẩn bị",
        );
      } else {
        toast.success("Đã chuyển đơn sang trạng thái đang chuẩn bị");
      }
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xác nhận đơn");
    } finally {
      setConfirmingId(null);
      setCardPendingActions((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancelingId(orderId);
    try {
      await orderOnlineService.cancelByStaff(orderId);
      toast.success("Đã hủy đơn giao hàng");
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể hủy đơn");
    } finally {
      setCancelingId(null);
      setCardPendingActions((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const openCancelConfirm = (orderId, mode = "pending") => {
    setCancelConfirm({
      open: true,
      orderId,
      mode,
    });
  };

  const handleConfirmCancelAction = async () => {
    const { orderId } = cancelConfirm;
    if (!orderId) return;

    setCancelConfirm({ open: false, orderId: null, mode: "pending" });

    await handleCancelOrder(orderId);
  };

  const openDetailModal = async (order) => {
    setIsDetailOpen(true);

    if (!isDeliveryOrder(order)) {
      setDetailLoading(false);
      setSelectedOrder(order);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await orderOnlineService.getStaffOrderDetail(order.id);
      setSelectedOrder(res?.data?.data || res?.data || null);
    } catch (error) {
      setSelectedOrder(null);
      toast.error(
        error?.response?.data?.message || "Không tải được chi tiết đơn giao",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintReceipt = async (orderId) => {
    try {
      toast.info("Đang lấy dữ liệu hóa đơn...");
      const res = await takeawayService.getReceipt(orderId);
      if (res.data?.receipt) {
        setViewingReceipt({
          ...res.data.receipt,
          printed_by: printerName,
          autoPrint: true,
        });
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu hóa đơn:", err);
      toast.error("Không thể lấy dữ liệu in hóa đơn");
    }
  };

  const handleMarkPrintSuccess = async (order) => {
    const orderId = Number(order?.order_id || order?.id || 0);

    if (!orderId) {
      toast.error("Không xác định được đơn hàng để cập nhật trạng thái in");
      throw new Error("Order ID is required");
    }

    try {
      await orderOnlineService.markPrintSuccess(orderId);
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái in hóa đơn",
      );
      throw error;
    }
  };

  const handleCompleteDeliveryOrder = async (orderId) => {
    setCompletingId(orderId);
    try {
      await orderOnlineService.completeDeliveryByStaff(orderId);
      toast.success("Đơn đã chuyển từ Đang chuẩn bị sang Hoàn thành");
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật đơn đã nhận",
      );
    } finally {
      setCompletingId(null);
    }
  };

  const openCashPaymentDialog = (order) => {
    setCashPaymentDialog({
      open: true,
      order,
      cashReceived: "",
    });
  };

  const closeCashPaymentDialog = () => {
    setCashPaymentDialog({
      open: false,
      order: null,
      cashReceived: "",
    });
  };

  const requiredAmount = Number(cashPaymentDialog.order?.total_amount || 0);
  const cashReceivedAmount = Number(cashPaymentDialog.cashReceived || 0);
  const isCashInputValid =
    cashPaymentDialog.cashReceived !== "" &&
    Number.isFinite(cashReceivedAmount) &&
    cashReceivedAmount >= requiredAmount;
  const changeAmount = Math.max(0, cashReceivedAmount - requiredAmount);

  const handleConfirmCashPayment = async () => {
    const orderId = Number(cashPaymentDialog.order?.id || 0);
    if (!orderId || !isCashInputValid) return;

    setCompletingId(orderId);
    try {
      await orderOnlineService.completeDeliveryByStaff(orderId, {
        cash_received: cashReceivedAmount,
      });
      toast.success("Xác nhận thanh toán thành công, đơn đã chuyển sang Hoàn thành");
      closeCashPaymentDialog();
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật đơn đã nhận",
      );
    } finally {
      setCompletingId(null);
    }
  };

  const renderOrderCard = (order) => {
    const paid = isOrderPaid(order);
    const deliveryOrder = isDeliveryOrder(order);
    const normalizedOrderType = normalizeOrderType(order?.order_type);
    const minutesAgo = getElapsedMinutes(order?.created_at);
    const isPending = order.status === "pending";
    const isPreparing = order.status === "preparing";
    const hasPrintedReceipt =
      String(order?.print_status || "").toUpperCase() === "SUCCESS";
    const isPendingUnpaidOnline =
      ["delivery", "takeaway"].includes(normalizedOrderType) &&
      isPending &&
      !paid;
    const selectedPendingAction = cardPendingActions[order.id] || "";
    const orderTypeMeta = getOrderTypeBadgeMeta(order?.order_type);
    const urgencyClass =
      minutesAgo > 10
        ? "border-red-300 animate-pulse"
        : minutesAgo > 5
          ? "border-amber-300"
          : "border-slate-200";

    return (
      <Card
        key={order.id}
        className={`overflow-hidden ${urgencyClass} transition-all hover:shadow-md bg-white`}
      >
        <div className="border-b border-slate-100 bg-slate-50/50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${deliveryOrder ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
                {deliveryOrder ? ( <div>
                  <Truck className="h-4 w-4" />
                  <span className="sr-only">Đơn giao hàng</span>
</div>
                ) : (
                  <div>
                  <Coffee className="h-4 w-4" />
                  <span className="sr-only">Đơn tại bàn</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold tracking-tight text-slate-900">Đơn #{order.id}</p>
                <div className="text-xs text-slate-500 font-medium">
                  {getRelativeTimeLabel(order.created_at)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={`${orderTypeMeta.className} border-none font-medium`}
              >
                <span className="mr-1">{orderTypeMeta.icon}</span>
                {orderTypeMeta.label}
              </Badge>
              <Badge className={`${statusClassMap[order.status] || ""} border-none font-medium shadow-none`}>
                {statusLabelMap[order.status] || order.status}
              </Badge>
              <Badge variant={paid ? "default" : "outline"} className={paid ? "bg-emerald-500 hover:bg-emerald-600 shadow-none text-white border-none" : "border-slate-300 text-slate-600"}>
                {paid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm">
            <div className="flex flex-col">
              <span className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">Tổng món</span>
              <span className="font-bold text-slate-900 text-lg">
                {order.itemCount || order?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">Tổng tiền</span>
              <span className="font-bold text-primary text-lg">
                {money(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="space-y-3 p-3">
          {isPendingUnpaidOnline ? (
            <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
              <p className="text-xs font-semibold text-amber-900">
                Xử lý đơn online chưa thanh toán
              </p>

              <div className="grid gap-1.5 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-amber-900">
                  <input
                    type="radio"
                    name={`card-pending-action-${order.id}`}
                    className="h-4 w-4"
                    checked={selectedPendingAction === "confirm"}
                    onChange={() =>
                      setCardPendingActions((prev) => ({
                        ...prev,
                        [order.id]: "confirm",
                      }))
                    }
                  />
                  <span>Nhận đơn</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-amber-900">
                  <input
                    type="radio"
                    name={`card-pending-action-${order.id}`}
                    className="h-4 w-4"
                    checked={selectedPendingAction === "cancel"}
                    onChange={() =>
                      setCardPendingActions((prev) => ({
                        ...prev,
                        [order.id]: "cancel",
                      }))
                    }
                  />
                  <span>Hủy đơn</span>
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              variant="outline"
              onClick={() => openDetailModal(order)}
            >
              Xem chi tiết
            </Button>

            {isPendingUnpaidOnline ? (
              selectedPendingAction === "confirm" ? (
                <Button
                  onClick={() => handleConfirmOrder(order)}
                  disabled={confirmingId === order.id}
                >
                  {confirmingId === order.id
                    ? "Đang xác nhận..."
                    : "Xác nhận nhận đơn"}
                </Button>
              ) : selectedPendingAction === "cancel" ? (
                <Button
                  variant="destructive"
                  onClick={() => openCancelConfirm(order.id, "pending")}
                  disabled={cancelingId === order.id}
                >
                  {cancelingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                </Button>
              ) : null
            ) : isPending ? (
              <Button
                onClick={() => handleConfirmOrder(order)}
                disabled={confirmingId === order.id}
              >
                {confirmingId === order.id
                  ? "Đang xác nhận..."
                  : "Nhận đơn"}
              </Button>
            ) : isPreparing ? (
              !hasPrintedReceipt ? (
                <Button
                  onClick={() => handlePrintReceipt(order.id)}
                >
                  In hóa đơn
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    !paid
                      ? openCashPaymentDialog(order)
                      : handleCompleteDeliveryOrder(order.id)
                  }
                  disabled={completingId === order.id}
                >
                  {completingId === order.id
                    ? "Đang cập nhật..."
                    : !paid
                      ? "Xác nhận thanh toán"
                      : "Hoàn thành"}
                </Button>
              )
            ) : null}

            {!(["completed", "cancelled"].includes(order.status) ||
              isPendingUnpaidOnline ||
              (isPending && paid) ||
              (isPreparing && !hasPrintedReceipt)) ? (
              <Button
                variant="destructive"
                onClick={() =>
                  openCancelConfirm(
                    order.id,
                    order.status === "preparing" ? "preparing" : "pending",
                  )
                }
                disabled={cancelingId === order.id}
              >
                {cancelingId === order.id ? "Đang hủy..." : "Hủy"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Quản lý đơn hàng
              </h2>
              <p className="text-sm text-slate-500">
                Theo dõi đơn theo từng loại và trạng thái xử lý
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {newOrderCount > 0 ? (
              <Badge variant="destructive" className="px-2.5 py-1 text-xs font-semibold shadow-sm">
                <Bell className="mr-1 h-3.5 w-3.5" />
                {newOrderCount} đơn mới
              </Badge>
            ) : null}

            <Button
              onClick={() => {
                setNewOrderCount(0);
                loadOrders();
              }}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-200 bg-white font-medium hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin text-primary" : ""}`} />
              Cập nhật
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {ORDER_TYPE_COLUMNS.map((column) => {
            const Icon = column.icon;
            const count = orderTypeCounts[column.key] || 0;

            return (
              <div
                key={column.key}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
              >
                <Icon className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">{column.label}</span>
                <Badge variant="secondary" className="ml-1">{count}</Badge>
              </div>
            );
          })}

          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
            <span className="text-sm font-medium text-blue-700">Đang chờ</span>
            <Badge variant="secondary">{counts.pending}</Badge>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5">
            <span className="text-sm font-medium text-rose-700">Trễ &gt; 10 phút</span>
            <Badge variant="secondary">{delayedOrdersCount}</Badge>
          </div>

          <Button
            variant={showCompletedColumn ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompletedColumn((prev) => !prev)}
            className={`gap-2 ${showCompletedColumn ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
          >
            {showCompletedColumn ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            Hoàn thành ({counts.completed})
          </Button>

          <Button
            variant={showCancelledColumn ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCancelledColumn((prev) => !prev)}
            className={`gap-2 ${showCancelledColumn ? "bg-slate-700 hover:bg-slate-800 text-white" : ""}`}
          >
            {showCancelledColumn ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            Đã hủy ({counts.cancelled})
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${visibleStatusColumns.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleStatusColumns.map((column) => {
            const columnOrders = groupedOrdersByStatus[column.key] || [];
            const isSecondaryColumn = ["completed", "cancelled"].includes(column.key);

            return (
              <div
                key={column.key}
                className={`rounded-xl border border-slate-200 bg-white shadow-sm ${isSecondaryColumn ? "opacity-75" : "opacity-100"}`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-800">{column.label}</span>
                  <Badge variant="secondary">{columnOrders.length}</Badge>
                </div>

                <div className="max-h-[calc(100vh-380px)] min-h-[260px] overflow-y-auto space-y-3 p-3">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Đang tải dữ liệu...
                    </p>
                  ) : columnOrders.length > 0 ? (
                    columnOrders.map((order) => renderOrderCard(order))
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Không có đơn trong cột này.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn {getOrderTypeLabel(selectedOrder?.order_type)} #
              {selectedOrder?.id || "--"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">
              Đang tải chi tiết...
            </p>
          ) : selectedOrder ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
                <p>
                  Người nhận:{" "}
                  <span className="font-medium">
                    {selectedOrder.receiver_name || "Không có tên người nhận"}
                  </span>
                </p>
                <p>
                  Số điện thoại:{" "}
                  <span className="font-medium">
                    {selectedOrder.receiver_phone || "Không có số điện thoại"}
                  </span>
                </p>
                <p>
                  Email:{" "}
                  <span className="font-medium">
                    {selectedOrder.receiver_email || "Không có email"}
                  </span>
                </p>
                <p>
                  Địa chỉ:{" "}
                  <span className="font-medium">
                    {selectedOrder.address || "Không có địa chỉ"}
                  </span>
                </p>
                <p>
                  Phương thức thanh toán:{" "}
                  <span className="font-medium">
                    {getPaymentMethodLabel(selectedOrder)}
                  </span>
                </p>
                <p>
                  Trạng thái thanh toán:{" "}
                  <span className="font-medium">
                    {isOrderPaid(selectedOrder)
                      ? "Đã thanh toán"
                      : "Chưa thanh toán"}
                  </span>
                </p>
                {selectedOrder.note ? (
                  <p className="sm:col-span-2">
                    Ghi chú đơn hàng:{" "}
                    <span className="font-medium">{selectedOrder.note}</span>
                  </p>
                ) : null}
                {isDeliveryOrder(selectedOrder) &&
                  selectedOrder.receiver_name && (
                    <div className="sm:col-span-2 border-t pt-3 mt-3">
                      <button
                        onClick={() => handlePrintReceipt(selectedOrder.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                      >
                        <Printer size={16} />
                        In hóa đơn
                      </button>
                    </div>
                  )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-semibold">
                  Danh sách món và topping
                </p>
                {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div
                      key={`${selectedOrder.id}-${item.id || item.product_name || item.name}`}
                      className="rounded-md border p-2 text-sm"
                    >
                      <p className="font-medium">
                        {item.name ||
                          item.productName ||
                          item.product_name ||
                          "Sản phẩm"}
                      </p>
                      <p className="text-muted-foreground">
                        Size {item.size} • x{item.quantity} •{" "}
                        {money(item.price || item.total_price)}
                      </p>
                      {Array.isArray(item.toppings) &&
                      item.toppings.length > 0 ? (
                        <p className="text-muted-foreground">
                          Topping:{" "}
                          {item.toppings
                            .map((top) => `${top.name} x${top.quantity || 1}`)
                            .join(", ")}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Không có topping
                        </p>
                      )}
                      {item.note ? (
                        <p className="text-muted-foreground">
                          Ghi chú: {item.note}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Đơn chưa có sản phẩm.
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <p className="text-sm">
                  Tổng tiền:{" "}
                  <span className="font-semibold">
                    {money(selectedOrder.total_amount)}
                  </span>
                </p>
              </div>

            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {viewingReceipt && (
        <ReceiptModal
          autoPrint={viewingReceipt.autoPrint}
          order={viewingReceipt}
          onPrint={handleMarkPrintSuccess}
          onClose={() => setViewingReceipt(null)}
        />
      )}

      <AlertDialog
        open={cancelConfirm.open}
        onOpenChange={(open) =>
          setCancelConfirm((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn hủy đơn không?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelConfirm.mode === "preparing"
                ? "Đơn đang trong quá trình chuẩn bị. Khi hủy, trạng thái đơn sẽ chuyển sang Hủy."
                : "Thao tác này sẽ hủy đơn hiện tại và không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleConfirmCancelAction}
            >
              Có, hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={cashPaymentDialog.open}
        onOpenChange={(open) => {
          if (!open) closeCashPaymentDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán tiền mặt</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                Đơn #{cashPaymentDialog.order?.id || "--"} cần thanh toán:{" "}
                <span className="font-semibold">{money(requiredAmount)}</span>
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Số tiền khách đưa
              </label>
              <Input
                type="number"
                min={0}
                step={1000}
                placeholder="Nhập số tiền khách đưa"
                value={cashPaymentDialog.cashReceived}
                onChange={(e) =>
                  setCashPaymentDialog((prev) => ({
                    ...prev,
                    cashReceived: e.target.value,
                  }))
                }
              />
            </div>

            {cashPaymentDialog.cashReceived !== "" &&
            cashReceivedAmount < requiredAmount ? (
              <p className="text-sm text-red-600">
                Số tiền nhập vào nhỏ hơn số tiền cần thanh toán.
              </p>
            ) : null}

            {isCashInputValid ? (
              <p className="text-sm text-emerald-700">
                Tiền thừa trả khách: <span className="font-semibold">{money(changeAmount)}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={closeCashPaymentDialog}>
              Đóng
            </Button>
            <Button
              onClick={handleConfirmCashPayment}
              disabled={
                !isCashInputValid ||
                completingId === Number(cashPaymentDialog.order?.id || 0)
              }
            >
              {completingId === Number(cashPaymentDialog.order?.id || 0)
                ? "Đang hoàn thành..."
                : "Xác nhận thanh toán & Hoàn thành"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
