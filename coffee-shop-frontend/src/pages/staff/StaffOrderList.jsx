import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Truck,
  Bell,
  Printer,
  Table,
  Table2,
  Coffee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  "served",
  "delivering",
  "completed",
  "cancelled",
];

const statusLabelMap = {
  pending: "Đang chờ",
  preparing: "Đang chuẩn bị",
  served: "Sẵn sàng phục vụ",
  delivering: "Giao hàng",
  completed: "Thành công",
  cancelled: "Hủy",
};

const statusClassMap = {
  pending: "bg-slate-100 text-slate-700",
  preparing: "bg-blue-100 text-blue-700",
  served: "bg-amber-100 text-amber-700",
  delivering: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const orderTypeLabelMap = {
  delivery: "Đơn giao hàng",
  "dine-in": "Tại bàn",
  takeaway: "Mang về",
};

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

const isPrintSuccess = (order) =>
  String(order?.print_status || "").toUpperCase() === "SUCCESS";

const dateTime = (value) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
  const [deliveringId, setDeliveringId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [pendingActionMap, setPendingActionMap] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeOrderType, setActiveOrderType] = useState("delivery");
  const [newOrderCount, setNewOrderCount] = useState(0);
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

  // Socket listener for new delivery orders
  useEffect(() => {
    const handleNewDeliveryOrder = (data) => {
      setNewOrderCount((prev) => prev + 1);
      toast.success(`🔔 Có đơn giao hàng mới! (#${data.order_id})`);
      // Auto-reload orders
      loadOrders();
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("new-delivery-order", handleNewDeliveryOrder);

    return () => {
      socket.off("new-delivery-order", handleNewDeliveryOrder);
    };
  }, [loadOrders]);

  const orderTypeCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const type = normalizeOrderType(order?.order_type);
        if (type in acc) {
          acc[type] += 1;
        }
        return acc;
      },
      { delivery: 0, "dine-in": 0, takeaway: 0 },
    );
  }, [orders]);

  const ordersByType = useMemo(() => {
    return orders.filter(
      (order) => normalizeOrderType(order?.order_type) === activeOrderType,
    );
  }, [orders, activeOrderType]);

  const counts = useMemo(() => {
    return ordersByType.reduce(
      (acc, order) => {
        const status = order?.status;
        if (STAFF_TAB_STATUSES.includes(status)) {
          acc[status] += 1;
        }
        return acc;
      },
      { pending: 0, preparing: 0, served: 0, delivering: 0, completed: 0, cancelled: 0 },
    );
  }, [ordersByType]);

  const filteredOrders = useMemo(() => {
    return ordersByType.filter((order) => order.status === activeTab);
  }, [ordersByType, activeTab]);

  useEffect(() => {
    setPendingActionMap((prev) => {
      const next = {};
      orders.forEach((order) => {
        if (prev[order.id]) {
          next[order.id] = prev[order.id];
        }
      });
      return next;
    });
  }, [orders]);

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
    const { orderId, mode } = cancelConfirm;
    if (!orderId) return;

    setCancelConfirm({ open: false, orderId: null, mode: "pending" });

    if (mode === "delivering") {
      await handleCancelDeliveringOrder(orderId);
      return;
    }

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

  const handleMarkDelivering = async (orderId) => {
    setDeliveringId(orderId);
    try {
      await orderOnlineService.markDeliveringByStaff(orderId);
      toast.success("Đơn hàng đã chuyển sang trạng thái đang giao");
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể chuyển đơn sang đang giao",
      );
    } finally {
      setDeliveringId(null);
    }
  };

  const handleCancelDeliveringOrder = async (orderId) => {
    setCancelingId(orderId);
    try {
      await orderOnlineService.cancelDeliveringByStaff(orderId);
      toast.success("Đã hủy đơn hàng đang giao");
      await loadOrders();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể hủy đơn đang giao",
      );
    } finally {
      setCancelingId(null);
    }
  };

  const handleCompleteDeliveryOrder = async (orderId) => {
    setCompletingId(orderId);
    try {
      await orderOnlineService.completeDeliveryByStaff(orderId);
      toast.success("Đã xác nhận khách nhận đơn thành công");
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
      toast.success("Đã xác nhận khách nhận đơn thành công");
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

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đơn hàng</h2>
            <p className="text-sm text-slate-500">Theo dõi và xử lý đơn hàng của quán</p>
          </div>
          {newOrderCount > 0 && (
            <Badge variant="destructive" className="ml-2 animate-pulse px-3 py-1 text-sm font-medium shadow-sm">
              <Bell className="mr-1.5 h-4 w-4" />
              {newOrderCount} đơn mới
            </Badge>
          )}
        </div>

        <Button
          onClick={() => {
            setNewOrderCount(0);
            loadOrders();
          }}
          disabled={loading}
          variant="outline"
          className="gap-2 bg-white hover:bg-slate-50 border-slate-200 shadow-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin text-primary" : ""}`} />
          Cập nhật
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Loại đơn hàng</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant={activeOrderType === "delivery" ? "default" : "outline"}
              onClick={() => { setActiveOrderType("delivery"); setActiveTab("pending"); }}
              className={`justify-start sm:w-44 transition-all ${
                activeOrderType === "delivery" 
                  ? "shadow-md bg-primary hover:bg-primary/90" 
                  : "hover:bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              <Truck className="mr-2 h-4 w-4" />
              <span>Giao hàng</span>
              <Badge variant={activeOrderType === "delivery" ? "secondary" : "secondary"} className="ml-auto bg-white/20 hover:bg-white/30 text-current border-none">
                {orderTypeCounts.delivery}
              </Badge>
            </Button>
            <Button
              variant={activeOrderType === "dine-in" ? "default" : "outline"}
              onClick={() => { setActiveOrderType("dine-in"); setActiveTab("pending"); }}
              className={`justify-start sm:w-44 transition-all ${
                activeOrderType === "dine-in" 
                  ? "shadow-md bg-primary hover:bg-primary/90" 
                  : "hover:bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              <Coffee className="mr-2 h-4 w-4" />
              <span>Tại bàn</span>
              <Badge variant={activeOrderType === "dine-in" ? "secondary" : "secondary"} className="ml-auto bg-white/20 hover:bg-white/30 text-current border-none">
                {orderTypeCounts["dine-in"]}
              </Badge>
            </Button>
            <Button
              variant={activeOrderType === "takeaway" ? "default" : "outline"}
              onClick={() => { setActiveOrderType("takeaway"); setActiveTab("pending"); }}
              className={`justify-start sm:w-44 transition-all ${
                activeOrderType === "takeaway" 
                  ? "shadow-md bg-primary hover:bg-primary/90" 
                  : "hover:bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Mang đi</span>
              <Badge variant={activeOrderType === "takeaway" ? "secondary" : "secondary"} className="ml-auto bg-white/20 hover:bg-white/30 text-current border-none">
                {orderTypeCounts.takeaway}
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 w-full">
          <Card className="border-cyan-100 bg-cyan-50/50 shadow-sm transition-all hover:shadow-md hover:bg-cyan-50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium text-cyan-800 flex items-center justify-between">
                <span>Giao hàng</span>
                <Truck className="h-4 w-4 text-cyan-600/50" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-900">{counts.served}</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm transition-all hover:shadow-md hover:bg-emerald-50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium text-emerald-800 flex items-center justify-between">
                <span>Thành công</span>
                <RefreshCw className="h-4 w-4 text-emerald-600/50" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-900">{counts.completed}</p>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-rose-50/50 shadow-sm transition-all hover:shadow-md hover:bg-rose-50">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-medium text-rose-800 flex items-center justify-between">
                <span>Đã Hủy</span>
                <ShoppingBag className="h-4 w-4 text-rose-600/50" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-rose-900">{counts.cancelled}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="rounded-xl bg-white p-2 shadow-sm border border-slate-100 overflow-hidden">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto bg-transparent p-1 gap-2 hide-scrollbar">
            <TabsTrigger value="pending" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg min-w-[120px]">
              Đang chờ <Badge variant="secondary" className="ml-2 bg-white/50">{counts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="preparing" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg min-w-[120px]">
              Đang pha chế <Badge variant="secondary" className="ml-2 bg-white/50">{counts.preparing}</Badge>
            </TabsTrigger>
            <TabsTrigger value="served" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm rounded-lg min-w-[140px]">
              Sẵn sàng phục vụ <Badge variant="secondary" className="ml-2 bg-white/50">{counts.served}</Badge>
            </TabsTrigger>
            <TabsTrigger value="delivering" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm rounded-lg min-w-[120px]">
              Giao hàng <Badge variant="secondary" className="ml-2 bg-white/50">{counts.delivering}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg min-w-[120px]">
              Thành công <Badge variant="secondary" className="ml-2 bg-white/50">{counts.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 whitespace-nowrap px-4 py-2.5 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm rounded-lg min-w-[120px]">
              Đã hủy <Badge variant="secondary" className="ml-2 bg-white/50">{counts.cancelled}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => {
              const paid = isOrderPaid(order);
              const deliveryOrder = isDeliveryOrder(order);
              const isUnpaidPending = order.status === "pending" && !paid;
              const isPending = order.status === "pending";

              return (
                <Card key={order.id} className="overflow-hidden border-slate-200 transition-all hover:shadow-md bg-white">
                  <div className="border-b border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-full ${deliveryOrder ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {deliveryOrder ? (
                            <Truck className="h-4 w-4" />
                          ) : (
                            <Coffee className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold tracking-tight text-slate-900">Đơn #{order.id}</p>
                          <div className="text-xs text-slate-500 font-medium">
                            {dateTime(order.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100/80 hover:bg-slate-200 border-none font-medium text-slate-700">
                          {getOrderTypeLabel(order.order_type)}
                        </Badge>
                        <Badge className={`${statusClassMap[order.status] || ""} border-none font-medium shadow-none`}>
                          {statusLabelMap[order.status] || order.status}
                        </Badge>
                        <Badge variant={paid ? "default" : "outline"} className={paid ? "bg-emerald-500 hover:bg-emerald-600 shadow-none text-white border-none" : "border-slate-300 text-slate-600"}>
                          {paid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-3 border border-slate-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Tổng món</span>
                        <span className="font-bold text-slate-900 text-lg">
                          {order.itemCount || order?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Tổng tiền</span>
                        <span className="font-bold text-primary text-lg">
                          {money(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-4 p-4">

                    {/* {Array.isArray(order.items) && order.items.length > 0 ? (
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${order.id}-${item.productName || item.name || idx}-${idx}`}
                            className="flex items-start justify-between gap-3 text-sm pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700">
                                {item.quantity}
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900 leading-none mt-1">
                                  {item.productName ||
                                    item.name ||
                                    item.product_name ||
                                    "Sản phẩm"}
                                </p>
                                <div className="text-xs text-slate-500 mt-1">
                                  <span className="font-medium text-slate-700">Size {item.size}</span>
                                  {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                                    <span className="ml-1.5 border-l border-slate-300 pl-1.5">
                                      + {item.toppings.map((top) => `${top.name} (x${top.quantity || 1})`).join(", ")}
                                    </span>
                                  )}
                                </div>
                                {item.note ? (
                                  <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md w-fit mt-1 border border-amber-100 font-medium">
                                    Ghi chú: {item.note}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <p className="font-medium text-slate-700 whitespace-nowrap mt-1">
                              {money(item.price || item.total_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-2">Không có thông tin sản phẩm</p>
                    )} */}

                    {deliveryOrder && isUnpaidPending ? (
                      <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                          <Bell className="h-4 w-4" /> Xử lý đơn hàng với khách
                        </p>
                        <div className="space-y-1 bg-white p-3 rounded-md border border-amber-100 shadow-sm">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                            Thông tin liên hệ
                          </p>
                          <p className="text-sm text-slate-700">
                            Khách hàng:{" "}
                            <span className="font-bold text-slate-900">
                              {order.receiver_name ||
                                order.customer_name ||
                                "--"}
                            </span>
                          </p>
                          <p className="text-xl font-black tracking-wider text-amber-600">
                            {order.receiver_phone ||
                              order.customer_phone ||
                              "--"}
                          </p>
                        </div>

                        <div className="space-y-3 pt-1">
                          <label className="flex items-start gap-3 text-sm font-medium text-amber-900 cursor-pointer p-2 rounded hover:bg-amber-100/50 transition-colors">
                            <input
                              type="radio"
                              name={`pending-action-${order.id}`}
                              className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500"
                              checked={pendingActionMap[order.id] === "confirm"}
                              onChange={(e) =>
                                setPendingActionMap((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.checked
                                    ? "confirm"
                                    : prev[order.id],
                                }))
                              }
                            />
                            <span>Xác nhận nhận đơn với khách hàng</span>
                          </label>

                          <label className="flex items-start gap-3 text-sm font-medium text-amber-900 cursor-pointer p-2 rounded hover:bg-amber-100/50 transition-colors">
                            <input
                              type="radio"
                              name={`pending-action-${order.id}`}
                              className="mt-0.5 h-4 w-4 text-amber-600 focus:ring-amber-500"
                              checked={pendingActionMap[order.id] === "cancel"}
                              onChange={(e) =>
                                setPendingActionMap((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.checked
                                    ? "cancel"
                                    : prev[order.id],
                                }))
                              }
                            />
                            <span>Hủy đơn / Gọi khách 3 lần, khách không nhấc máy</span>
                          </label>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openDetailModal(order)}
                      >
                        Xem chi tiết
                      </Button>

                      {deliveryOrder && isUnpaidPending ? (
                        <>
                          {pendingActionMap[order.id] === "cancel" ? (
                            <Button
                              variant="destructive"
                              onClick={() =>
                                openCancelConfirm(order.id, "pending")
                              }
                              disabled={cancelingId === order.id}
                            >
                              {cancelingId === order.id ? "Đang hủy..." : "Hủy"}
                            </Button>
                          ) : pendingActionMap[order.id] === "confirm" ? (
                            <Button
                              onClick={() => handleConfirmOrder(order)}
                              disabled={confirmingId === order.id}
                            >
                              {confirmingId === order.id
                                ? "Đang xác nhận..."
                                : "Chuẩn bị đơn"}
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground self-center">
                              Chọn 1 phương án để thực hiện thao tác.
                            </p>
                          )}
                        </>
                      ) : deliveryOrder && isPending ? (
                        <Button
                          onClick={() => handleConfirmOrder(order)}
                          disabled={confirmingId === order.id}
                        >
                          {confirmingId === order.id
                            ? "Đang xác nhận..."
                            : "Xác nhận chuẩn bị"}
                        </Button>
                      ) : deliveryOrder && order.status === "served" ? (
                        <Button
                          onClick={() =>
                            isPrintSuccess(order)
                              ? handleMarkDelivering(order.id)
                              : handlePrintReceipt(order.id)
                          }
                          disabled={deliveringId === order.id}
                          className="gap-2"
                        >
                          {isPrintSuccess(order) ? (
                            <Truck size={16} />
                          ) : (
                            <Printer size={16} />
                          )}
                          {isPrintSuccess(order)
                            ? deliveringId === order.id
                              ? "Đang chuyển..."
                              : "Giao hàng"
                            : "In hóa đơn"}
                        </Button>
                      ) : deliveryOrder && order.status === "delivering" ? (
                        <>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              openCancelConfirm(order.id, "delivering")
                            }
                            disabled={cancelingId === order.id}
                          >
                            {cancelingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                          </Button>
                          <Button
                            onClick={() =>
                              isOrderPaid(order)
                                ? handleCompleteDeliveryOrder(order.id)
                                : openCashPaymentDialog(order)
                            }
                            disabled={completingId === order.id}
                          >
                            {completingId === order.id
                              ? "Đang cập nhật..."
                              : "Đã nhận đơn"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!loading && filteredOrders.length === 0 ? (
              <Card className="lg:col-span-2 xl:col-span-3">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Không có đơn {getOrderTypeLabel(activeOrderType)} trong
                    trạng thái đã chọn.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
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
                    {selectedOrder.receiver_name || "--"}
                  </span>
                </p>
                <p>
                  Số điện thoại:{" "}
                  <span className="font-medium">
                    {selectedOrder.receiver_phone || "--"}
                  </span>
                </p>
                <p>
                  Email:{" "}
                  <span className="font-medium">
                    {selectedOrder.receiver_email || "--"}
                  </span>
                </p>
                <p>
                  Địa chỉ:{" "}
                  <span className="font-medium">
                    {selectedOrder.address || "--"}
                  </span>
                </p>
                <p>
                  Phương thức thanh toán:{" "}
                  <span className="font-medium">
                    {selectedOrder.payment_method === "payos"
                      ? "PayOS"
                      : selectedOrder.payment_method === "cash"
                        ? "Tiền mặt"
                        : "--"}
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
              {cancelConfirm.mode === "delivering"
                ? "Đơn đang trong quá trình giao. Khi hủy, trạng thái đơn sẽ chuyển sang Hủy."
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
                : "Hoàn thành"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
