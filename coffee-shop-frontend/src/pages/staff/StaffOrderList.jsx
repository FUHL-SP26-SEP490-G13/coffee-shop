import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RefreshCw,
  ShoppingBag,
  Truck,
  Bell,
  Printer,
  Coffee,
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

const STAFF_TAB_STATUSES = ["pending", "preparing", "completed", "cancelled"];

const statusLabelMap = {
  pending: "Đang chờ",
  preparing: "Đang chuẩn bị",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const orderTypeLabelMap = {
  all: "Tất cả",
  delivery: "Giao hàng",
  "dine-in": "Tại bàn",
  takeaway: "Mang về",
};

const ORDER_TYPE_COLUMNS = [
  { key: "delivery", label: "Giao hàng", icon: Truck },
  { key: "dine-in", label: "Tại bàn", icon: Coffee },
  { key: "takeaway", label: "Mang về", icon: ShoppingBag },
];

const DELIVERY_FEE = 20000;

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
    order?.payment_method ||
      order?.paymentMethod ||
      order?.payment?.method ||
      "",
  ).toLowerCase();

  if (method === "payos") return "PayOS";
  if (method === "cash") return "Tiền mặt";
  return "--";
};

const sortOrdersByStatus = (status, list) => {
  const sorted = [...list];
  const toTime = (order) => new Date(order?.created_at || 0).getTime();

  if (status === "completed" || status === "cancelled") {
    sorted.sort((a, b) => toTime(b) - toTime(a));
  } else {
    sorted.sort((a, b) => toTime(a) - toTime(b));
  }

  return sorted;
};

export function OrderDelivery() {
  const navigate = useNavigate();
  const { status: routeStatus } = useParams();

  const activeStatus = STAFF_TAB_STATUSES.includes(routeStatus)
    ? routeStatus
    : "pending";

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
  const [detailPendingAction, setDetailPendingAction] = useState("");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [selectedOrderType, setSelectedOrderType] = useState("all");
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [cashPaymentDialog, setCashPaymentDialog] = useState({
    open: false,
    order: null,
    cashReceived: "",
  });
  const [printerName, setPrinterName] = useState("Nhân viên");

  useEffect(() => {
    if (!STAFF_TAB_STATUSES.includes(routeStatus)) {
      navigate("/staff/orders/pending", { replace: true });
    }
  }, [navigate, routeStatus]);

  useEffect(() => {
    setSelectedOrderType("all");
  }, [activeStatus]);

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
      toast.error("Không tải được danh sách đơn hàng");
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

  useEffect(() => {
    const notifyAndReload = (label, data) => {
      setNewOrderCount((prev) => prev + 1);
      toast.success(`Có đơn ${label} mới! (#${data.order_id})`);
      loadOrders();
    };

    const handleNewDeliveryOrder = (data) => notifyAndReload("giao hàng", data);

    const handleNewTakeawayOrder = (data) => notifyAndReload("mang về", data);

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

  const activeStatusOrders = useMemo(() => {
    const list = orders.filter((order) => order?.status === activeStatus);
    return sortOrdersByStatus(activeStatus, list);
  }, [activeStatus, orders]);

  const delayedOrdersCount = useMemo(() => {
    if (!["pending", "preparing"].includes(activeStatus)) return 0;
    return activeStatusOrders.filter((order) => {
      return getElapsedMinutes(order?.created_at) > 10;
    }).length;
  }, [activeStatus, activeStatusOrders]);

  const orderTypeCounts = useMemo(() => {
    return activeStatusOrders.reduce(
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
  }, [activeStatusOrders]);

  const groupedOrdersByType = useMemo(() => {
    const grouped = {
      delivery: [],
      "dine-in": [],
      takeaway: [],
    };

    activeStatusOrders.forEach((order) => {
      const type = normalizeOrderType(order?.order_type);
      if (type in grouped) {
        grouped[type].push(order);
      }
    });

    return grouped;
  }, [activeStatusOrders]);

  const visibleOrderTypeColumns = useMemo(() => {
    if (selectedOrderType === "all") {
      return ORDER_TYPE_COLUMNS;
    }
    return ORDER_TYPE_COLUMNS.filter(
      (column) => column.key === selectedOrderType,
    );
  }, [selectedOrderType]);

  const handleConfirmOrder = async (order) => {
    setConfirmingId(order.id);
    let success = false;

    try {
      await orderOnlineService.confirmPreparing(order.id);
      if (!isOrderPaid(order)) {
        toast.success("Đã xác nhận với khách hàng, đơn chuyển sang Preparing");
      } else {
        toast.success("Đơn đã chuyển sang Preparing");
      }
      await loadOrders();
      success = true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xác nhận đơn");
    } finally {
      setConfirmingId(null);
    }

    return success;
  };

  const handleCancelOrder = async (orderId) => {
    setCancelingId(orderId);
    let success = false;

    try {
      await orderOnlineService.cancelByStaff(orderId);
      toast.success("Đã hủy đơn hàng");
      await loadOrders();
      success = true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể hủy đơn");
    } finally {
      setCancelingId(null);
    }

    return success;
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
    const success = await handleCancelOrder(orderId);
    if (success) {
      setIsDetailOpen(false);
    }
  };

  const openDetailModal = async (order) => {
    setIsDetailOpen(true);
    setDetailPendingAction("");

    if (!isDeliveryOrder(order)) {
      setDetailLoading(false);
      setSelectedOrder(order);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await orderOnlineService.getStaffOrderDetail(order.id);
      const detail = res?.data?.data || res?.data || null;
      setSelectedOrder(detail ? { ...order, ...detail } : order);
    } catch (error) {
      setSelectedOrder(order);
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
        const sourceOrder =
          Number(selectedOrder?.id || 0) === Number(orderId)
            ? selectedOrder
            : orders.find((item) => Number(item?.id || 0) === Number(orderId));

        setViewingReceipt({
          ...sourceOrder,
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

    setSelectedOrder((prev) =>
      Number(prev?.id || 0) === orderId
        ? { ...prev, print_status: "SUCCESS" }
        : prev,
    );
    setOrders((prev) =>
      prev.map((item) =>
        Number(item?.id || 0) === orderId
          ? { ...item, print_status: "SUCCESS" }
          : item,
      ),
    );

    try {
      await orderOnlineService.markPrintSuccess(orderId);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái in hóa đơn",
      );
      await loadOrders();
      throw error;
    }
  };

  const handleCompleteDeliveryOrder = async (orderId) => {
    setCompletingId(orderId);
    let success = false;

    try {
      await orderOnlineService.completeDeliveryByStaff(orderId);
      toast.success("Đơn đã chuyển sang Completed");
      await loadOrders();
      success = true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật đơn đã nhận",
      );
    } finally {
      setCompletingId(null);
    }

    return success;
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
      toast.success(
        "Xác nhận thanh toán thành công, đơn đã chuyển sang Completed",
      );
      closeCashPaymentDialog();
      setIsDetailOpen(false);
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật đơn đã nhận",
      );
    } finally {
      setCompletingId(null);
    }
  };

  const selectedOrderIsPending = selectedOrder?.status === "pending";
  const selectedOrderIsPreparing = selectedOrder?.status === "preparing";
  const selectedOrderPaid = isOrderPaid(selectedOrder);
  const selectedOrderIsPendingUnpaidDelivery =
    selectedOrderIsPending &&
    isDeliveryOrder(selectedOrder) &&
    !selectedOrderPaid;
  const selectedOrderHasPrintedReceipt =
    String(selectedOrder?.print_status || "").toUpperCase() === "SUCCESS";

  const handleConfirmFromDetail = async () => {
    if (!selectedOrder) return;
    const success = await handleConfirmOrder(selectedOrder);
    if (success) {
      setIsDetailOpen(false);
      setDetailPendingAction("");
    }
  };

  const handleCompleteFromDetail = async () => {
    if (!selectedOrder) return;
    const success = await handleCompleteDeliveryOrder(selectedOrder.id);
    if (success) {
      setIsDetailOpen(false);
    }
  };

  const renderDetailActionButtons = () => {
    if (detailLoading || !selectedOrder) return null;

    if (selectedOrderIsPendingUnpaidDelivery) {
      if (detailPendingAction === "confirm") {
        return (
          <Button
            onClick={handleConfirmFromDetail}
            disabled={confirmingId === selectedOrder.id}
          >
            {confirmingId === selectedOrder.id
              ? "Đang nhận đơn..."
              : "Nhận đơn"}
          </Button>
        );
      }

      if (detailPendingAction === "cancel") {
        return (
          <Button
            variant="destructive"
            onClick={() => openCancelConfirm(selectedOrder.id, "pending")}
            disabled={cancelingId === selectedOrder.id}
          >
            {cancelingId === selectedOrder.id ? "Đang hủy..." : "Hủy đơn"}
          </Button>
        );
      }

      return null;
    }

    if (selectedOrderIsPending) {
      return (
        <Button
          onClick={handleConfirmFromDetail}
          disabled={confirmingId === selectedOrder.id}
        >
          {confirmingId === selectedOrder.id ? "Đang nhận đơn..." : "Nhận đơn"}
        </Button>
      );
    }

    if (selectedOrderIsPreparing) {
      if (!selectedOrderHasPrintedReceipt) {
        return (
          <Button onClick={() => handlePrintReceipt(selectedOrder.id)}>
            <Printer size={16} />
            In hóa đơn
          </Button>
        );
      }

      return (
        <>
          <Button
            onClick={() =>
              !selectedOrderPaid
                ? openCashPaymentDialog(selectedOrder)
                : handleCompleteFromDetail()
            }
            disabled={completingId === selectedOrder.id}
          >
            {completingId === selectedOrder.id
              ? "Đang cập nhật..."
              : "Thành công"}
          </Button>

          <Button
            variant="destructive"
            onClick={() => openCancelConfirm(selectedOrder.id, "preparing")}
            disabled={cancelingId === selectedOrder.id}
          >
            {cancelingId === selectedOrder.id ? "Đang hủy..." : "Hủy đơn"}
          </Button>
        </>
      );
    }

    return null;
  };

  const renderCompactOrderCard = (order) => {
    const paid = isOrderPaid(order);

    return (
      <Card key={order.id} className="border-slate-200 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none">
        <CardContent className="p-3 md:p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900">
                Đơn #{order.id}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {getRelativeTimeLabel(order.created_at)}
              </p>
            </div>
            <Badge
              variant={paid ? "default" : "outline"}
              className={`h-6 px-2 text-[11px] font-medium ${
                paid
                  ? "bg-emerald-500 text-white hover:bg-emerald-500"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {paid ? "Đã thanh toán" : "Chưa thanh toán"}
            </Badge>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-base font-bold color-green-500 leading-none text-slate-900 ">
              {money(order.total_amount)}
            </p>
            <Button
              size="sm"
              className="h-9 w-full px-3 text-sm sm:h-7 sm:w-auto sm:px-2.5 sm:text-xs"
              variant={activeStatus === "pending" ? "default" : "outline"}
              onClick={() => openDetailModal(order)}
            >
              {activeStatus === "pending" ? "Xác nhận" : "Xem chi tiết"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-3 px-4 pb-1 pt-1 md:px-6 md:pb-3 md:pt-2">
      <div className="rounded-xl border border-slate-200 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm dark:shadow-none md:px-4 md:py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              Danh sách đơn hàng
            </h2>
            <p className="text-xs text-slate-500 md:text-sm">
              Trạng thái hiện tại: {statusLabelMap[activeStatus]}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {newOrderCount > 0 ? (
              <Badge
                variant="destructive"
                className="px-2.5 py-1 text-xs font-semibold shadow-sm dark:shadow-none"
              >
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
              className="h-9 gap-1.5 border-slate-200 bg-white dark:bg-gray-900 px-3 text-xs font-medium hover:bg-slate-50 md:h-8 md:px-2.5"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin text-primary" : "text-slate-500"}`}
              />
              Cập nhật
            </Button>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pb-0.5 pt-2.5 md:flex-wrap md:overflow-visible md:pb-0">
          {Object.entries(orderTypeLabelMap).map(([typeKey, label]) => (
            <Button
              key={typeKey}
              size="sm"
              variant={selectedOrderType === typeKey ? "default" : "outline"}
              onClick={() => setSelectedOrderType(typeKey)}
              className="h-9 shrink-0 gap-1.5 px-2.5 text-xs md:h-8"
            >
              {label}
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 px-1.5 text-[11px]"
              >
                {orderTypeCounts[typeKey] || 0}
              </Badge>
            </Button>
          ))}

          {["pending", "preparing"].includes(activeStatus) ? (
            <div className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 md:ml-auto md:h-8">
              <span className="text-xs font-medium text-rose-700">
                Trễ &gt; 10 phút
              </span>
              <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                {delayedOrdersCount}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className={`grid gap-3 ${selectedOrderType === "all" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"}`}
        >
          {visibleOrderTypeColumns.map((column) => {
            const Icon = column.icon;
            const columnOrders = groupedOrdersByType[column.key] || [];

            return (
              <div
                key={column.key}
                className="rounded-xl border border-slate-200 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-800">
                      {column.label}
                    </span>
                  </div>
                  <Badge variant="secondary">{columnOrders.length}</Badge>
                </div>

                <div className="max-h-none min-h-[220px] space-y-2 overflow-visible p-3 md:max-h-[calc(100vh-300px)] md:min-h-[400px] md:overflow-y-auto">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Đang tải dữ liệu...
                    </p>
                  ) : columnOrders.length > 0 ? (
                    columnOrders.map((order) => renderCompactOrderCard(order))
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
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setDetailPendingAction("");
          }
        }}
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
                    {selectedOrderPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </p>
                {selectedOrder.note ? (
                  <p className="sm:col-span-2">
                    Ghi chú đơn hàng:{" "}
                    <span className="font-medium">{selectedOrder.note}</span>
                  </p>
                ) : null}

                {selectedOrderIsPendingUnpaidDelivery ? (
                  <div className="sm:col-span-2 mt-2 rounded-md border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 p-3">
                    <p className="mb-2 text-sm font-semibold text-amber-900">
                      Xử lý đơn giao hàng chưa thanh toán
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm text-amber-900">
                        <input
                          type="radio"
                          name="modal-pending-action"
                          className="h-4 w-4"
                          checked={detailPendingAction === "confirm"}
                          onChange={() => setDetailPendingAction("confirm")}
                        />
                        <span>Nhận đơn</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-amber-900">
                        <input
                          type="radio"
                          name="modal-pending-action"
                          className="h-4 w-4"
                          checked={detailPendingAction === "cancel"}
                          onChange={() => setDetailPendingAction("cancel")}
                        />
                        <span>Hủy đơn</span>
                      </label>
                    </div>
                  </div>
                ) : null}
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

              <div className="flex flex-col items-end gap-1">
                {isDeliveryOrder(selectedOrder) ? (
                  <p className="text-sm text-slate-600">
                    Phí vận chuyển:{" "}
                    <span className="font-medium">{money(DELIVERY_FEE)}</span>
                  </p>
                ) : null}
                <p className="text-sm">
                  Tổng tiền:{" "}
                  <span className="font-semibold">
                    {money(selectedOrder.total_amount)}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Đóng
                </Button>
                {renderDetailActionButtons()}
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
        onOpenChange={(open) => setCancelConfirm((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn hủy đơn không?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelConfirm.mode === "preparing"
                ? "Đơn đang trong quá trình chuẩn bị. Khi hủy, trạng thái đơn sẽ chuyển sang Cancelled."
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
                Tiền thừa trả khách:{" "}
                <span className="font-semibold">{money(changeAmount)}</span>
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
