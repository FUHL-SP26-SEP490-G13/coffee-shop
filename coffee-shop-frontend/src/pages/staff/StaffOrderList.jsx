import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  RefreshCw,
  ShoppingBag,
  Truck,
  Bell,
  Printer,
  Coffee,
  CheckCircle,
  Loader2,
  BookOpen,
  User,
  Phone,
  MapPin,
  Clock,
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
import BaristaViewRecipe from "../barista/BaristaOrder/BaristaViewRecipe";
import { PrintableReceipt } from "./PrintableReceipt";

const STAFF_TAB_STATUSES = ["pending", "management", "served", "completed", "cancelled", "barista-window"];

const statusLabelMap = {
  pending: {
    label: "Online chờ xác nhận",
    className: "text-rose-600 dark:text-rose-300",
  },
  management: {
    label: "Quản lý đơn hàng",
    className: "text-blue-600 dark:text-blue-300",
  },
  preparing: {
    label: "Đang chuẩn bị",
    className: "text-blue-600 dark:text-blue-300",
  },
  completed: {
    label: "Hoàn thành",
    className: "text-emerald-600 dark:text-emerald-300",
  },
  cancelled: {
    label: "Đã hủy",
    className: "text-gray-600 dark:text-gray-400",
  },
  "barista-window": {
    label: "Cửa sổ pha chế",
    className: "text-amber-600 dark:text-amber-300",
  },
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

const gridStatusLabelMap = {
  all: "Tất cả",
  preparing: "Đang làm",
  completed: "Hoàn thành",
};

const GRID_STATUS_COLUMNS = [
  { key: "preparing", label: "Đang làm", icon: Clock },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle },
];

const LOYALTY_MONEY_PER_POINT = 100;
const MONEY_ROUNDING_UNIT = 100;
const LEGACY_DELIVERY_SHIPPING_FEE = 20000;
const DYNAMIC_SHIPPING_ROLLOUT_AT = new Date("2026-04-07T00:00:00.000Z").getTime();

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

const calculateOrderItemsSubtotal = (items = []) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const itemQuantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Number(item?.price ?? item?.unit_price ?? 0);
    return sum + Math.max(0, unitPrice * itemQuantity);
  }, 0);
};

const shouldUseLegacyShippingFallback = (order) => {
  const createdAtMs = new Date(order?.created_at || 0).getTime();
  return Number.isFinite(createdAtMs) && createdAtMs < DYNAMIC_SHIPPING_ROLLOUT_AT;
};

const getShippingFee = (order) => {
  if (!isDeliveryOrder(order)) return 0;

  const feeFromApi = Number(order?.shipping_fee);
  if (Number.isFinite(feeFromApi) && feeFromApi > 0) {
    return Math.round(feeFromApi / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  }

  const loyaltyDiscountAmount =
    Math.max(0, Number(order?.used_points || 0)) * LOYALTY_MONEY_PER_POINT;
  const orderTotal = Math.max(0, Number(order?.total_amount || 0));
  const itemsSubtotal = calculateOrderItemsSubtotal(order?.items);

  const derived =
    Math.round((orderTotal + loyaltyDiscountAmount - itemsSubtotal) / MONEY_ROUNDING_UNIT) *
    MONEY_ROUNDING_UNIT;
  if (Number.isFinite(derived) && derived > 0) {
    return derived;
  }

  if (shouldUseLegacyShippingFallback(order)) {
    return LEGACY_DELIVERY_SHIPPING_FEE;
  }

  return 0;
};

const getOrderAmount = (order) => {
  return Math.max(0, Number(order?.amount || 0));
};

const getOrderDeliveryFee = (order) => {
  if (!isDeliveryOrder(order)) return 0;

  const feeFromApi = Number(order?.delivery_fee ?? order?.shipping_fee);
  if (Number.isFinite(feeFromApi) && feeFromApi >= 0) {
    return Math.round(feeFromApi / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  }

  return getShippingFee(order);
};

const getOrderDiscountAmount = (order) => {
  const discountFromApi = Number(order?.discount_amount);
  if (Number.isFinite(discountFromApi) && discountFromApi >= 0) {
    return discountFromApi;
  }

  const amountForDiscountCalc = Math.max(
    0,
    Number(order?.amount || 0) || calculateOrderItemsSubtotal(order?.items)
  );
  const total = Math.max(0, Number(order?.total_amount || 0));
  const deliveryFee = Math.max(0, getOrderDeliveryFee(order));
  return Math.max(0, amountForDiscountCalc + deliveryFee - total);
};

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
  
  let paid = false;
  if (paymentStatus === "paid") {
    paid = true;
  } else {
    paid = order?.is_paid === true || order?.is_paid === 1 || order?.is_paid === "1";
  }

  // Đơn online (delivery hoặc order đang ở trạng thái pending) nếu chưa in hóa đơn thì xem như chưa thanh toán
  const isOnline = 
    String(order?.order_type || "").toLowerCase() === "delivery" || 
    String(order?.status || "").toLowerCase() === "pending";

  if (isOnline && String(order?.print_status || "").toUpperCase() !== "SUCCESS") {
    return false;
  }

  return paid;
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

const getStatusWeight = (orderStatus) => {
  const s = String(orderStatus || "").toLowerCase();
  if (s === "preparing") return 1;
  if (s === "pending") return 2;
  if (s === "served") return 3;
  if (s === "completed") return 4;
  return 5;
};

const sortOrdersByStatus = (status, list) => {
  const sorted = [...list];
  const toTime = (order) => new Date(order?.created_at || 0).getTime();

  if (status === "management") {
    // View tổng hợp "Quản lý đơn hàng": ưu tiên theo trạng thái, sau đó mới đến thời gian
    sorted.sort((a, b) => {
      const weightA = getStatusWeight(a.status);
      const weightB = getStatusWeight(b.status);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return toTime(a) - toTime(b); // Cùng trạng thái thì đơn gọi trước (cũ hơn) xếp trên
    });
  } else if (status === "pending" || status === "completed" || status === "cancelled") {
    sorted.sort((a, b) => toTime(b) - toTime(a)); // Mới nhất xếp trên
  } else {
    sorted.sort((a, b) => toTime(a) - toTime(b)); // Cũ xếp trên
  }

  return sorted;
};

export function OrderDelivery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status: routeStatus } = useParams();

  const isBaristaWindow = location.pathname.includes("barista-window");
  const activeStatus = isBaristaWindow 
    ? "barista-window"
    : STAFF_TAB_STATUSES.includes(routeStatus)
      ? routeStatus
      : "pending";
  const activeStatusMeta =
    statusLabelMap[activeStatus] || {
      label: "Không xác định",
      className: "text-slate-600 dark:text-slate-300",
    };

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
  const [selectedGridStatus, setSelectedGridStatus] = useState("all");
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [viewRecipeItem, setViewRecipeItem] = useState(null);
  const [preparingSubTab, setPreparingSubTab] = useState("preparing");
  const [cashPaymentDialog, setCashPaymentDialog] = useState({
    open: false,
    order: null,
    cashReceived: "",
  });
  const [printerName, setPrinterName] = useState("Nhân viên");
  const [overview, setOverview] = useState({
    totalOrders: 0,
    onlineWaiting: 0,
    displayPreparing: 0,
    readyOrders: 0,
  });

  useEffect(() => {
    const isBaristaWindow = location.pathname.includes("barista-window");
    if (!isBaristaWindow && routeStatus && !STAFF_TAB_STATUSES.includes(routeStatus)) {
      navigate("/staff/orders/pending", { replace: true });
    }
  }, [navigate, routeStatus, location.pathname]);

  useEffect(() => {
    setSelectedGridStatus("all");
  }, [activeStatus]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baristaDBService.getActiveOrders([
        "pending", "preparing", "served", "completed", "cancelled"
      ]);
      const list = res?.data?.data || res?.data || [];

      const activeOrders = list
        .sort((a, b) => {
          const createdDiff =
            new Date(a?.created_at || 0).getTime() -
            new Date(b?.created_at || 0).getTime();

          if (createdDiff !== 0) return createdDiff;
          return Number(a?.id || 0) - Number(b?.id || 0);
        });

      setOrders(activeOrders);

      // Compute stats for the top bar from the FULL list (not just activeOrders)
      const onlineWaiting = (Array.isArray(list) ? list : []).filter(o => 
        String(o.status || "").toLowerCase() === 'pending' && (o.order_type === 'delivery' || o.order_type === 'takeaway')
      ).length;
      
      const preparingCount = (Array.isArray(list) ? list : []).filter(o => String(o.status || "").toLowerCase() === 'preparing').length;
      const dineInPending = (Array.isArray(list) ? list : []).filter(o => String(o.status || "").toLowerCase() === 'pending' && o.order_type === 'dine-in').length;
      const ready = (Array.isArray(list) ? list : []).filter(o => String(o.status || "").toLowerCase() === 'served').length;

      setOverview({
        totalOrders: activeOrders.length,
        onlineWaiting: onlineWaiting,
        displayPreparing: preparingCount + dineInPending,
        readyOrders: ready
      });
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
      toast.success(`Có đơn ${label} mới! (#${data.order_id || data.id || ''})`);
      loadOrders();
    };

    const handleNewDeliveryOrder = (data) => notifyAndReload("giao hàng", data);
    const handleNewTakeawayOrder = (data) => notifyAndReload("mang về", data);
    
    const silentReload = () => {
      loadOrders();
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("new-delivery-order", handleNewDeliveryOrder);
    socket.on("new-takeaway-order", handleNewTakeawayOrder);
    
    // Barista-like background refreshing events
    socket.on("new-order", silentReload);
    socket.on("new-dine-in-order", silentReload);
    socket.on("order-online:new", silentReload);
    socket.on("barista:notification", silentReload);

    return () => {
      socket.off("new-delivery-order", handleNewDeliveryOrder);
      socket.off("new-takeaway-order", handleNewTakeawayOrder);
      socket.off("new-order", silentReload);
      socket.off("new-dine-in-order", silentReload);
      socket.off("order-online:new", silentReload);
      socket.off("barista:notification", silentReload);
    };
  }, [loadOrders]);

  const activeStatusOrders = useMemo(() => {
    const list = orders.filter((order) => {
      if (activeStatus === "management") {
        if (
          String(order?.status).toLowerCase() === "cancelled" &&
          (order?.order_type === "delivery" || order?.order_type === "takeaway")
        ) {
          return false;
        }
        return true; // Quản lý đơn hàng: hiển thị tất cả trừ online đã hủy
      }
      if (activeStatus === "pending") {
        return order?.status === "pending" && (order.order_type === "delivery" || order.order_type === "takeaway");
      }
      return order?.status === activeStatus;
    });
    return sortOrdersByStatus(activeStatus, list);
  }, [activeStatus, preparingSubTab, orders]);

  const delayedOrdersCount = useMemo(() => {
    if (!["pending", "management"].includes(activeStatus)) return 0;
    return activeStatusOrders.filter((order) => {
      return getElapsedMinutes(order?.created_at) > 10;
    }).length;
  }, [activeStatus, activeStatusOrders]);

  const gridStatusCounts = useMemo(() => {
    return activeStatusOrders.reduce(
      (acc, order) => {
        acc.all += 1;
        const s = String(order?.status || "").toLowerCase();
        if (s === "pending" || s === "preparing") acc.preparing += 1;
        else if (["served", "completed"].includes(s)) acc.completed += 1;
        return acc;
      },
      { all: 0, preparing: 0, completed: 0 },
    );
  }, [activeStatusOrders]);

  const groupedOrdersByType = useMemo(() => {
    const grouped = {
      delivery: [],
      "dine-in": [],
      takeaway: [],
    };

    activeStatusOrders.forEach((order) => {
      const s = String(order?.status || "").toLowerCase();
      let matchStatus = false;
      
      if (selectedGridStatus === "all") {
        matchStatus = true;
      } else if (selectedGridStatus === "preparing" && (s === "pending" || s === "preparing")) {
        matchStatus = true;
      } else if (selectedGridStatus === "completed" && (s === "served" || s === "completed")) {
        matchStatus = true;
      }

      if (matchStatus) {
        const type = normalizeOrderType(order?.order_type);
        if (type in grouped) {
          grouped[type].push(order);
        }
      }
    });

    return grouped;
  }, [activeStatusOrders, selectedGridStatus]);

  const visibleOrderTypeColumns = useMemo(() => {
    let columns = ORDER_TYPE_COLUMNS;
    
    if (activeStatus === "pending") {
      columns = columns.filter(col => col.key !== "dine-in");
    }

    return columns;
  }, [activeStatus]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await baristaDBService.updateOrderStatus(orderId, status);
      toast.success("Cập nhật trạng thái thành công");
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

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
      
      // Tự động in nhãn/hóa đơn sau khi xác nhận thành công
      handlePrintReceipt(order.id);
      
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

  const handleCompleteDeliveryOrder = async (orderId, autoCashReceived = undefined) => {
    setCompletingId(orderId);
    let success = false;

    try {
      const payload = autoCashReceived !== undefined ? { cash_received: autoCashReceived } : undefined;
      await orderOnlineService.completeDeliveryByStaff(orderId, payload);
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
  const selectedOrderIsServed = selectedOrder?.status === "served";
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
    const success = await handleCompleteDeliveryOrder(
      selectedOrder.id,
      !selectedOrderPaid ? Number(selectedOrder.total_amount || 0) : undefined
    );
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
              ? "Đang xác nhận..."
              : "Xác nhận đơn"}
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
          {confirmingId === selectedOrder.id ? "Đang xác nhận..." : "Xác nhận đơn"}
        </Button>
      );
    }

    if (selectedOrderIsPreparing || selectedOrderIsServed) {
      if (!selectedOrderHasPrintedReceipt) {
        return (
          <Button onClick={() => handlePrintReceipt(selectedOrder.id)}>
            <Printer size={16} />
            In hóa đơn
          </Button>
        );
      }

      // Chỉ hiển thị trạng thái đang pha chế, không có thao tác hoàn thành/hủy
      return null;
    }

    return null;
  };

  const renderCompactOrderCard = (order) => {
    const paid = isOrderPaid(order);
    const amount = getOrderAmount(order);
    const discountAmount = getOrderDiscountAmount(order);
    const deliveryFee = getOrderDeliveryFee(order);

    return (
      <Card key={order.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none">
        <CardContent className="p-3 md:p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                Đơn #{order.id}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                {getRelativeTimeLabel(order.created_at)}
              </p>
              {String(order.order_type || "").toLowerCase() === "dine-in" && (order.table_code || order.table_id) && (
                <p className="mt-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-max px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                   Bàn: {order.table_code || order.table_id}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {(() => {
                const statusStr = String(order.status || "").toLowerCase();
                let label = "Không rõ";
                let colorClass = "bg-slate-100 text-slate-600";
                
                if (statusStr === "pending") {
                  label = "Chờ xác nhận";
                  colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                } else if (statusStr === "preparing") {
                  label = "Đang làm";
                  colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                } else if (statusStr === "served") {
                  label = "Đã xong";
                  colorClass = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
                } else if (statusStr === "completed") {
                  label = "Hoàn thành";
                  colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                } else if (statusStr === "cancelled") {
                  label = "Đã hủy";
                  colorClass = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
                }

                return (
                  <Badge
                    variant="outline"
                    className={`h-6 px-2 text-[11px] font-bold border-0 ${colorClass}`}
                  >
                    {label}
                  </Badge>
                );
              })()}
              
              <Badge
                variant={paid ? "default" : "outline"}
                className={`h-5 px-1.5 text-[10px] font-medium leading-none tracking-wide ${
                  paid
                    ? "bg-emerald-500 text-white hover:bg-emerald-500"
                    : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-200"
                }`}
              >
                {paid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Badge>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-base font-bold color-green-500 leading-none text-slate-900 ">
              {money(order.total_amount)}
            </p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                size="sm"
                className={`h-9 flex-1 text-sm sm:h-7 sm:px-2.5 sm:text-xs ${activeStatus === "management" ? "" : "w-full sm:w-auto"}`}
                variant={activeStatus === "pending" ? "default" : "outline"}
                onClick={() => openDetailModal(order)}
              >
                {activeStatus === "pending" ? "Xác nhận" : "Chi tiết"}
              </Button>

            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden pt-0 ${activeStatus === 'barista-window' ? 'px-2 pb-2 sm:px-4 sm:pb-4' : 'px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8'}`}>
      {/* {activeStatus !== "barista-window" && (
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold">Danh sách đơn hàng</h1>
        </div>
      )} */}



      {activeStatus !== "barista-window" && (
        <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 md:px-4">
          <div className="min-w-0">

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

            {/* <Button
              onClick={() => {
                setNewOrderCount(0);
                loadOrders();
              }}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-3 text-xs font-medium dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 md:h-8 md:px-2.5"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin text-primary" : "text-slate-500 dark:text-slate-300"}`}
              />
              Cập nhật
            </Button> */}
          </div>
        </div>
      )}

      {activeStatus !== "barista-window" && !(activeStatus === "pending" || activeStatus === "cancelled") && (
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pb-1 pt-2.5 md:flex-wrap md:overflow-visible md:pb-1">

            {Object.entries(gridStatusLabelMap)
              .map(([typeKey, label]) => (
              <Button
                key={typeKey}
                size="sm"
                variant={selectedGridStatus === typeKey ? "default" : "outline"}
                onClick={() => setSelectedGridStatus(typeKey)}
                className="h-9 shrink-0 gap-1.5 px-2.5 text-xs md:h-8"
              >
                {label}
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 px-1.5 text-[11px]"
                >
                  {gridStatusCounts[typeKey] || 0}
                </Badge>
              </Button>
            ))}

            {["pending", "management"].includes(activeStatus) ? (
              <div className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 md:ml-auto md:h-8">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  Trễ &gt; 10 phút
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                  {delayedOrdersCount}
                </Badge>
              </div>
            ) : null}
          </div>
        )}

      {activeStatus !== "barista-window" && (activeStatus === "pending" || activeStatus === "cancelled") && (
        <div className="flex-shrink-0 flex gap-4 mb-4">
          <div className="relative group">
            <Button
              variant={activeStatus === "pending" ? "default" : "outline"}
              className={`h-12 px-10 rounded-2xl font-black text-sm transition-all shadow-md ${activeStatus === "pending" ? "shadow-primary/30 scale-105" : "bg-card hover:bg-muted"}`}
              onClick={() => navigate("/staff/orders/pending")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              ĐƠN ONLINE MỚI
            </Button>
            {overview.onlineWaiting > 0 && (
              <>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-black text-white shadow-lg ring-4 ring-background z-10">
                  {overview.onlineWaiting}
                </span>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 rounded-full bg-rose-600 animate-ping opacity-75 ring-4 ring-background"></span>
              </>
            )}
          </div>

          <Button
            variant={activeStatus === "cancelled" ? "default" : "outline"}
            className={`h-12 px-10 rounded-2xl font-black text-sm transition-all shadow-sm ${activeStatus === "cancelled" ? "shadow-rose-500/20 scale-105" : "bg-card hover:bg-muted"}`}
            onClick={() => navigate("/staff/orders/cancelled")}
          >
            ĐƠN ĐÃ HỦY
          </Button>
        </div>
      )}

      {activeStatus === "barista-window" ? (
        <div className="flex-1 min-h-0 flex flex-col gap-6">
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-2xl py-6 px-10 shadow-sm flex items-center justify-center">
            <h2 className="text-3xl font-black tracking-[0.2em] text-primary dark:text-primary uppercase">
              DANH SÁCH ĐƠN PHA CHẾ
            </h2>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
            {/* COLUMN LEFT: Đơn mới */}
            <div className="flex flex-col min-h-0 bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 p-6">
              <div className="flex-shrink-0 mb-6 flex justify-center">
                <div className="bg-primary border-2 border-primary/30 px-12 py-3 rounded-full shadow-md">
                  <span className="text-lg font-bold text-white tracking-wide uppercase">Đơn mới</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {orders.filter(o => String(o.status || "").toLowerCase() === 'preparing').length > 0 ? (
                  orders.filter(o => String(o.status || "").toLowerCase() === 'preparing').map((order) => (
                    <Card 
                      key={order.id} 
                      className="rounded-2xl border-2 border-primary/20 dark:border-primary/30 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailOpen(true);
                      }}
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xl font-black text-primary italic">Đơn #{order.id}</span>
                          <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {getRelativeTimeLabel(order.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{money(order.total_amount)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <Coffee className="h-10 w-10" />
                    <p className="font-medium">Chưa có đơn hàng mới</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN RIGHT: Đã xong */}
            <div className="flex flex-col min-h-0 bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] border-2 border-primary/20 p-6">
              <div className="flex-shrink-0 mb-6 flex justify-center">
                <div className="bg-primary/90 border-2 border-primary/30 px-12 py-3 rounded-full shadow-md">
                  <span className="text-lg font-bold text-white tracking-wide uppercase">Đã xong</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {orders.filter(o => String(o.status || "").toLowerCase() === 'completed').length > 0 ? (
                  orders.filter(o => String(o.status || "").toLowerCase() === 'completed')
                    .sort((a, b) => b.id - a.id)
                    .map((order) => (
                    <Card 
                      key={order.id} 
                      className="rounded-2xl border-2 border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailOpen(true);
                      }}
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 italic">Đơn #{order.id}</span>
                          <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {getRelativeTimeLabel(order.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <CheckCircle className="w-6 h-6" />
                          <span>Hoàn tất</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <CheckCircle className="h-10 w-10" />
                    <p className="font-medium">Chưa có đơn hoàn thành</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : ["pending", "cancelled"].includes(activeStatus) ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStatusOrders.length > 0 ? (
                activeStatusOrders.map((order) => {
                  const items = order.items || order.orderItems || [];
                  const isCancelled = order.status === "cancelled" || order.status === "REFUNDED";
                  
                  return (
                    <Card 
                      key={order.id} 
                      className={`rounded-[2.5rem] border-2 bg-card overflow-hidden transition-all hover:shadow-xl cursor-pointer ${isCancelled ? 'border-rose-100/50 bg-rose-50/10' : 'border-border/60 hover:border-primary/20 hover:scale-[1.02]'}`}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailOpen(true);
                      }}
                    >
                      <CardContent className="p-8 space-y-5">
                        {/* Top Row */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-0.5">
                             <span className={`text-xl font-black italic ${isCancelled ? 'text-rose-600/70' : activeStatus === 'barista-window' ? 'text-amber-600' : 'text-foreground'}`}>
                               {isCancelled ? "Đơn Hủy" : activeStatus === 'barista-window' ? "ĐƠN PHA CHẾ" : "Đơn"} #{order.id}
                             </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-lg w-fit">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <span className={`text-xl font-black italic ${isCancelled ? 'text-rose-400' : 'text-foreground'}`}>
                            {money(order.total_amount)}
                          </span>
                        </div>

                        {/* Product List */}
                        <div className="space-y-4 py-2 min-h-[140px] max-h-[200px] overflow-y-auto pr-2 custom-scrollbar-thin">
                          {items.map((item, idx) => (
                            <div key={idx} className="space-y-1 opacity-80">
                               <div className="flex justify-between font-bold text-sm">
                                  <span className="truncate mr-2 max-w-[65%]">
                                    {item.product_name || item.productName || item.name}
                                    <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                                      {item.size || item.product_size}
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground whitespace-nowrap text-xs font-black">
                                    {money(item.price || item.unit_price)} × {item.quantity}
                                  </span>
                               </div>
                               {item.toppings && item.toppings.length > 0 && (
                                 <div className="pl-4 border-l-2 border-muted/50 space-y-0.5 mt-1">
                                    {item.toppings.map((t, tid) => (
                                      <div key={tid} className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/60 italic">
                                        <span>• {t.topping_name || t.name} x{t.quantity}</span>
                                        <span>{money(t.price)}</span>
                                      </div>
                                    ))}
                                 </div>
                               )}
                            </div>
                          ))}
                        </div>

                        {/* Customer Info (Only show if not cancelled or if requested) */}
                        <div className="space-y-2 p-4 bg-muted/20 rounded-[2rem] border-2 border-dotted border-muted/30">
                          <div className="flex items-center gap-3">
                             <User className="h-3.5 w-3.5 text-muted-foreground/40" />
                             <span className="text-[xs] font-black text-muted-foreground italic uppercase truncate">{order.receiver_name || order.customer_name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <Phone className="h-3.5 w-3.5 text-muted-foreground/40" />
                             <span className="text-[10px] font-bold text-muted-foreground italic truncate">{order.receiver_phone || order.phone || "K/O Số điện thoại"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <MapPin className="h-3.5 w-3.5 text-muted-foreground/40" />
                             <span className="text-[10px] font-bold text-muted-foreground italic truncate">{order.address || "K/O Địa chỉ"}</span>
                          </div>
                        </div>

                        {/* Footer Buttons (Hidden for cancelled or barista-window) */}
                        {!isCancelled && activeStatus !== "barista-window" && (
                          <div className="flex gap-2 pt-2 h-12">
                             <Button 
                               variant="outline" 
                               className="flex-1 rounded-2xl border-2 border-destructive/20 font-bold text-destructive hover:bg-destructive hover:text-white text-xs"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setCancelConfirm({ open: true, orderId: order.id, mode: "pending" });
                               }}
                               disabled={cancelingId === order.id}
                             >
                               Hủy
                             </Button>

                             <Button 
                               className="flex-[2] rounded-2xl font-black text-xs shadow-lg shadow-primary/20"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleConfirmOrder(order);
                               }}
                               disabled={confirmingId === order.id}
                             >
                               {confirmingId === order.id ? (
                                 <RefreshCw className="h-4 w-4 animate-spin" />
                               ) : (
                                 "Xác nhận & In nhãn"
                               )}
                             </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">
                    {activeStatus === "barista-window" 
                      ? "Hiện tại không có đơn hàng nào cần pha chế. Bạn có thể thư giãn một chút! ☕" 
                      : "Không có đơn hàng hàng nào trong mục này."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto">
          <div
            className={`grid gap-3 h-full ${activeStatus === "pending" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}
          >
            {visibleOrderTypeColumns.map((column) => {
              const Icon = column.icon;
              const columnOrders = groupedOrdersByType[column.key] || [];

              return (
                <div
                  key={column.key}
                  className="flex flex-col min-h-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none"
                >
                  <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {column.label}
                      </span>
                    </div>
                    <Badge variant="secondary">{columnOrders.length}</Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar">
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
      )}

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setDetailPendingAction("");
          }
        }}
      >
        <DialogContent contentWidth="70rem" className="sm:max-w-4xl">
          {activeStatus !== "barista-window" && (
            <DialogHeader>
              <DialogTitle>
                Chi tiết đơn {getOrderTypeLabel(selectedOrder?.order_type)} #
                {selectedOrder?.id || "--"}
              </DialogTitle>
            </DialogHeader>
          )}

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">
              Đang tải chi tiết...
            </p>
          ) : selectedOrder ? (
            activeStatus === "barista-window" ? (
              <div className="flex flex-col gap-4 font-sans text-slate-800">
                <h3 className="text-xl font-bold mb-2">Đơn #{selectedOrder.id}</h3>
                
                <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="border-2 border-slate-700 bg-white p-4 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between font-bold text-lg">
                           <span>{item.name || item.productName || item.product_name}</span>
                           <span>Size {item.size}</span>
                        </div>
                        {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                          <div className="flex flex-col text-slate-700 text-base leading-relaxed">
                             {item.toppings.map((top, tIdx) => (
                                <span key={tIdx}>{top.name} {top.quantity > 1 ? `x${top.quantity}` : ''}</span>
                             ))}
                          </div>
                        )}
                        <div className="flex justify-end mt-2">
                          <button 
                            className="border-2 border-slate-700 px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors bg-white shadow-sm"
                            onClick={() =>
                              setViewRecipeItem({
                                product: { id: item.productId || item.product_id, name: item.name || item.productName || item.product_name },
                                size: { id: item.productSizeId || item.size_id || item.product_size_id, size: item.size }
                              })
                            }
                          >
                             Xem công thức
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-slate-500">Đơn chưa có thực đơn.</p>
                  )}
                </div>

                <div className="border-2 border-slate-700 p-4 min-h-[80px] bg-white shadow-sm mt-2">
                  <span className="font-bold">Ghi chú: </span>
                  {selectedOrder.note || "(Không có ghi chú)"}
                </div>

                <div className="flex justify-center gap-6 mt-6">
                   <button 
                     className="border-2 border-slate-700 px-8 py-2.5 rounded-2xl font-bold hover:bg-slate-100 transition-colors bg-white shadow-sm"
                     onClick={() => setIsDetailOpen(false)}
                   >
                     Đóng
                   </button>
                   {String(selectedOrder?.status || "").toLowerCase() !== 'completed' && (
                     <button 
                       className="border-2 border-emerald-600 text-emerald-700 px-8 py-2.5 rounded-2xl font-bold hover:bg-emerald-50 transition-colors bg-white shadow-sm"
                       onClick={() => {
                          handleStatusChange(selectedOrder.id, 'completed');
                          setIsDetailOpen(false);
                       }}
                     >
                       Xác nhận xong
                     </button>
                   )}
                </div>
              </div>
            ) : (
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-5 space-y-4">
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    <p className="text-sm font-semibold">Thông tin người nhận</p>
                    <p>
                      Người nhận:{" "}
                      <span className="font-medium">
                        {selectedOrder.receiver_name || "Khách lẻ"}
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
                    {selectedOrder.note ? (
                      <p>
                        Ghi chú đơn hàng:{" "}
                        <span className="font-medium">{selectedOrder.note}</span>
                      </p>
                    ) : null}
                  </div>

                  {selectedOrderIsPendingUnpaidDelivery ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/30">
                      <p className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Xử lý đơn giao hàng chưa thanh toán
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                          <input
                            type="radio"
                            name="modal-pending-action"
                            className="h-4 w-4"
                            checked={detailPendingAction === "confirm"}
                            onChange={() => setDetailPendingAction("confirm")}
                          />
                          <span>Nhận đơn</span>
                        </label>

                        <label className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
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

                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm font-semibold">Danh sách món và topping</p>
                    {Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => (
                        <div
                          key={`${selectedOrder.id}-${item.id || item.product_name || item.name}`}
                          className="rounded-md border p-2 text-sm"
                        >
                          <p className="font-medium">
                            {item.name || item.productName || item.product_name} - {item.size}
                          </p>
                          <p className="text-muted-foreground">
                            x{item.quantity} •{" "}
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
                            <p className="text-muted-foreground">Không có topping</p>
                          )}
                          {item.note ? (
                            <p className="text-muted-foreground">Ghi chú: {item.note}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Đơn chưa có sản phẩm.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-md border bg-slate-50 p-3 text-sm dark:bg-slate-800/40">
                    <p className="text-sm font-semibold">Thông tin thanh toán</p>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Tạm tính</span>
                      <span className="font-medium">{money(getOrderAmount(selectedOrder))}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-300">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{money(getOrderDiscountAmount(selectedOrder))}</span>
                    </div>
                    <div className="flex justify-between text-sky-600 dark:text-sky-300">
                      <span>Phí vận chuyển</span>
                      <span className="font-medium">+{money(getOrderDeliveryFee(selectedOrder))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Tổng thanh toán</span>
                      <span>{money(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phương thức thanh toán</span>
                      <span className="font-medium text-foreground">
                        {getPaymentMethodLabel(selectedOrder)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Trạng thái thanh toán</span>
                      <span className="font-medium text-foreground">
                        {selectedOrderPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </div>
                  </div>
                </div>
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
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {viewingReceipt && (
        <PrintableReceipt
          order={viewingReceipt}
          onPrintSuccess={handleMarkPrintSuccess}
          onDone={() => setViewingReceipt(null)}
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
              <p className="text-sm text-red-600 dark:text-red-400">
                Số tiền nhập vào nhỏ hơn số tiền cần thanh toán.
              </p>
            ) : null}

            {isCashInputValid ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
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
      {viewRecipeItem && (
        <BaristaViewRecipe
          open={!!viewRecipeItem}
          product={viewRecipeItem.product}
          size={viewRecipeItem.size}
          onClose={() => setViewRecipeItem(null)}
        />
      )}
    </div>
  );
}
