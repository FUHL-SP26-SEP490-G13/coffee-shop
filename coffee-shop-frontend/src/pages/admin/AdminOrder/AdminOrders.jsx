import { useState, useEffect, useMemo } from "react";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  ShoppingBag,
  Loader2,
  Eye,
  CreditCard,
  User,
  MapPin,
  ReceiptText,
} from "lucide-react";
import orderService from "../../../services/orderService";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [orderCodeFilter, setOrderCodeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const hasAdvancedFilters =
    statusFilter !== "all" ||
    orderTypeFilter !== "all" ||
    Boolean(orderCodeFilter.trim()) ||
    Boolean(startDateFilter) ||
    Boolean(endDateFilter);
  const isInvalidDateRange =
    Boolean(startDateFilter) &&
    Boolean(endDateFilter) &&
    startDateFilter > endDateFilter;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (isInvalidDateRange) {
          setOrders([]);
          setTotalPages(1);
          setTotalItems(0);
          return;
        }

        setLoading(true);
        const params = {
          page: 1,
          limit: 10000,
          status: statusFilter,
        };

        if (orderTypeFilter !== "all") {
          params.order_type = orderTypeFilter;
        }

        if (orderCodeFilter.trim()) {
          params.order_code = orderCodeFilter.trim().replace(/^#/, "");
        }

        if (startDateFilter) {
          params.start_date = startDateFilter;
        }

        if (endDateFilter) {
          params.end_date = endDateFilter;
        }

        const res = await orderService.getAllOrders(params);
        setOrders(res.data || []);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        toast.error("Không thể lấy danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [
    statusFilter,
    orderTypeFilter,
    orderCodeFilter,
    startDateFilter,
    endDateFilter,
    isInvalidDateRange,
  ]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
  };

  const handleOrderTypeChange = (val) => {
    setOrderTypeFilter(val);
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setOrderTypeFilter("all");
    setOrderCodeFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const getStatusInfo = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return {
          key: "pending",
          label: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800",
        };
      case "preparing":
        return {
          key: "preparing",
          label: "Đang chuẩn bị",
          color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800",
        };
      case "preparing_done":
        return {
          key: "preparing_done",
          label: "Đã chuẩn bị xong",
          color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800",
        };
      case "completed":
        return {
          key: "completed",
          label: "Hoàn thành",
          color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800",
        };
      case "cancelled":
        return {
          key: "cancelled",
          label: "Đã hủy",
          color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800",
        };
      default:
        return {
          key: String(status).toLowerCase(),
          label: status,
          color: "bg-muted text-muted-foreground text-foreground",
        };
    }
  };

  const getOrderTypeInfo = (type) => {
    switch (String(type).toLowerCase()) {
      case "dine-in":
        return {
          label: "Tại quán",
          color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800",
        };
      case "takeaway":
        return {
          label: "Mang đi",
          color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800",
        };
      case "delivery":
        return {
          label: "Giao hàng",
          color: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800",
        };
      default:
        return { label: type, color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" };
    }
  };
// Tính tổng tiền của đơn hàng dựa trên các món và topping, dùng để đối chiếu với total_amount từ API để suy ra phí giao hàng nếu có
  const calculateSubtotal = (order) => {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => {
      return sum + Number(item.price || 0) * item.quantity;
    }, 0);
  };

  const normalizeOrderType = (value) => {
    const type = String(value || "").toLowerCase();
    if (type === "dinein") return "dine-in";
    if (type === "take-away") return "takeaway";
    return type;
  };

  const getShippingFee = (order, subtotal = calculateSubtotal(order)) => {
    if (normalizeOrderType(order?.order_type) !== "delivery") return 0;

    const feeFromApi = Number(order?.delivery_fee ?? order?.shipping_fee);
    if (Number.isFinite(feeFromApi) && feeFromApi > 0) {
      return feeFromApi;
    }

    const orderTotal = Number(order?.total_amount || 0);
    const derivedFee = orderTotal - Number(subtotal || 0);
    if (Number.isFinite(derivedFee) && derivedFee > 0) {
      return derivedFee;
    }

    return 0;
  };

  const statusSummary = useMemo(() => {
    const base = {
      all: 0,
      pending: 0,
      preparing: 0,
      preparing_done: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const statusKey = getStatusInfo(order.status).key;
      if (statusKey in base) {
        base[statusKey] += 1;
      }
      base.all += 1;
    });

    return base;
  }, [orders]);

  const quickFilters = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "preparing", label: "Đang chuẩn bị" },
    { value: "preparing_done", label: "Đã chuẩn bị xong" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                Quản lý Đơn hàng
              </h1>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground p-3 sm:p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Mã đơn</p>
              <Input
                value={orderCodeFilter}
                onChange={(e) => {
                  setOrderCodeFilter(e.target.value);
                }}
                placeholder="Ví dụ: 1025 hoặc #01025"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Từ ngày</p>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                }}
                max={endDateFilter || undefined}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Đến ngày</p>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                }}
                min={startDateFilter || undefined}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn hàng</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                  <SelectItem value="preparing_done">Đã chuẩn bị xong</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Loại đơn</p>
              <Select value={orderTypeFilter} onValueChange={handleOrderTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại đơn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại đơn</SelectItem>
                  <SelectItem value="dine-in">Tại quán</SelectItem>
                  <SelectItem value="takeaway">Mang đi</SelectItem>
                  <SelectItem value="delivery">Giao hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {isInvalidDateRange ? (
              <p className="text-xs text-red-600">
                Khoảng ngày không hợp lệ: ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lọc theo mã đơn, ngày tạo, trạng thái và loại đơn hàng.
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={!hasAdvancedFilters}
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {quickFilters.map((filter) => {
          const isActive = statusFilter === filter.value;
          const count = statusSummary[filter.value] || 0;

          return (
            // lọc theo trạng thái
            <button
              key={filter.value}
              type="button"
              onClick={() => handleStatusChange(filter.value)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${isActive
                ? "border-primary/40 bg-primary/10"
                : "border-border bg-card text-card-foreground hover:bg-muted"
                }`}
            >
              <p
                className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {filter.label}
              </p>
              <p className="text-xl font-bold text-foreground leading-tight mt-1">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-64 rounded-2xl border bg-card text-card-foreground flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <span className="text-sm font-medium">
              Đang tải danh sách đơn hàng...
            </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-64 rounded-2xl border bg-card text-card-foreground flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="p-4 bg-muted rounded-full">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <span className="text-sm font-medium">Chưa có đơn hàng nào</span>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Mã đơn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Món
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Khách
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Xem chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const typeInfo = getOrderTypeInfo(order.order_type);
                    const items = Array.isArray(order.items) ? order.items : [];
                    const itemCount = items.length;
                    const itemPreview = items
                      .slice(0, 2)
                      .map((item) => item.product?.name || "Sản phẩm")
                      .join(", ");
                    const customerName =
                      order.receiver_name ||
                      order.user?.full_name ||
                      order.user?.name ||
                      "Khách lẻ";

                    return (
                      <tr key={order.id} className="hover:bg-muted/80 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono font-semibold text-foreground bg-muted px-2.5 py-1 rounded-md text-xs">
                            #{String(order.id).padStart(5, "0")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground align-top whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge
                            variant="outline"
                            className={`font-medium inline-flex items-center ${statusInfo.color}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0 opacity-75" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant="outline" className={`font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top max-w-[260px]">
                          <p className="font-medium text-foreground leading-5">
                            {itemCount} món
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate" title={itemPreview || "Không có sản phẩm"}>
                            {itemPreview || "Không có sản phẩm"}
                            {itemCount > 2 ? ` +${itemCount - 2}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <p className="text-sm font-semibold text-primary whitespace-nowrap">
                            {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[160px]">
                          <p className="text-sm font-medium text-foreground leading-5">
                            {customerName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.receiver_phone || "Không có số điện thoại"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <Button
                            variant="outline"
                            className="h-9"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent
          contentWidth="70rem"
          className="max-h-[90vh] overflow-y-auto p-0 gap-0"
        >
          {selectedOrder && (
            <>
              <DialogHeader className="p-6 border-b bg-muted bg-muted sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl flex items-center gap-2">
                      Đơn hàng{" "}
                      <span className="text-primary font-mono">
                        #{String(selectedOrder.id).padStart(5, "0")}
                      </span>
                    </DialogTitle>
                    <DialogDescription>
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "vi-VN",
                      )}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        getOrderTypeInfo(selectedOrder.order_type).color
                      }
                      variant="outline"
                    >
                      {getOrderTypeInfo(selectedOrder.order_type).label}
                    </Badge>
                    <Badge
                      className={getStatusInfo(selectedOrder.status).color}
                      variant="outline"
                    >
                      {getStatusInfo(selectedOrder.status).label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-4">
                  {/* Customer Info */}
                  <div className="rounded-xl border border-border  bg-card text-card-foreground   p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <User className="w-4 h-4" />
                      Thông tin đơn hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <span className="font-medium text-foreground">
                          {getStatusInfo(selectedOrder.status).label}
                        </span>
                      </div>

                      {(selectedOrder.receiver_name ||
                        selectedOrder.receiver_phone ||
                        selectedOrder.receiver_email) && (
                          <div className="pt-2 border-t border-dashed border-border" />
                        )}

                      {selectedOrder.receiver_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tên nhận:</span>
                          <span className="font-medium text-foreground">
                            {selectedOrder.receiver_name}
                          </span>
                        </div>
                      )}
                      {selectedOrder.receiver_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SĐT:</span>
                          <span className="font-medium text-foreground">
                            {selectedOrder.receiver_phone}
                          </span>
                        </div>
                      )}
                      {selectedOrder.receiver_email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-foreground">
                            {selectedOrder.receiver_email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="rounded-xl border border-border  bg-card text-card-foreground   p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <MapPin className="w-4 h-4" />
                      Chi tiết nhận hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.address ? (
                        <div>
                          <span className="text-muted-foreground block mb-1">
                            Địa chỉ:
                          </span>
                          <p className="font-medium text-foreground  leading-relaxed">
                            {selectedOrder.address}
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hình thức:</span>
                          <span className="font-medium text-foreground ">
                            {getOrderTypeInfo(selectedOrder.order_type).label}
                          </span>
                        </div>
                      )}
                      {selectedOrder.note && (
                        <div className="mt-2 pt-2 border-t border-dashed border-border ">
                          <span className="text-muted-foreground block mb-1">
                            Ghi chú giao hàng:
                          </span>
                          <span className="text-foreground  bg-yellow-50/50 p-2 rounded block">
                            {selectedOrder.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  {/* Items List */}
                  <div className="rounded-xl border border-border  shadow-sm overflow-hidden">
                    <div className="bg-muted bg-muted p-3 border-b border-border  flex items-center gap-2 text-primary font-medium">
                      <ReceiptText className="w-4 h-4" />
                      Danh sách sản phẩm
                    </div>
                    <div className="divide-y divide-gray-100">
                      {selectedOrder.items &&
                        selectedOrder.items.map((item, index) => {
                          const unitTotal = Number(item.price || 0);
                          const toppings = Array.isArray(item.toppings)
                            ? item.toppings
                            : Array.isArray(item.toppings_raw)
                              ? item.toppings_raw.filter((t) => t)
                              : [];
                          const toppingsPrice = toppings.reduce(
                            (sum, t) => sum + Number(t.price || 0),
                            0,
                          );
                          const baseDrinkPrice = Math.max(
                            0,
                            unitTotal - toppingsPrice,
                          );

                          return (
                            <div
                              key={index}
                              className="p-4 flex justify-between gap-4 bg-card text-card-foreground   hover:bg-muted dark:hover:bg-gray-800 /30 transition-colors"
                            >
                              <div className="flex gap-3">
                                <span className="font-semibold text-foreground bg-muted  w-6 h-6 flex items-center justify-center rounded text-sm shrink-0">
                                  {item.quantity}
                                </span>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground  leading-none">
                                    {item.product?.name || "Sản phẩm"}
                                    <span className="ml-2 font-normal text-muted-foreground">
                                      (
                                      {Number(baseDrinkPrice).toLocaleString(
                                        "vi-VN",
                                      )}
                                      đ)
                                    </span>
                                  </p>
                                  {item.size && (
                                    <p className="text-xs text-muted-foreground">
                                      Size:{" "}
                                      <span className="font-medium text-foreground ">
                                        {item.size}
                                      </span>
                                    </p>
                                  )}
                                  {toppings.length > 0 && (
                                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5 mt-1">
                                      {toppings.map((t, idx) => (
                                        <li key={idx}>
                                          <span className="text-foreground ">
                                            {t.name}
                                          </span>{" "}
                                          (+
                                          {Number(t.price || 0).toLocaleString(
                                            "vi-VN",
                                          )}
                                          đ)
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {item.note && (
                                    <p className="text-xs text-amber-600 bg-amber-50 inline-block px-1.5 py-0.5 rounded mt-1">
                                      Note: {item.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-medium text-foreground ">
                                  {Number(
                                    unitTotal * item.quantity,
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </p>
                                {toppings.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    ({Number(unitTotal).toLocaleString("vi-VN")}
                                    đ/sp)
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {(() => {
                    const subtotal = calculateSubtotal(selectedOrder);
                    const shippingFee = getShippingFee(selectedOrder, subtotal);
                    const total = Number(selectedOrder.total_amount || 0);
                    const discountAmount = Math.max(0, subtotal + shippingFee - total);

                    return (
                      <div className="rounded-xl bg-muted  p-4 space-y-3">
                        <div className="flex items-center gap-2 text-foreground  font-medium pb-2 border-b border-border ">
                          <CreditCard className="w-4 h-4" />
                          Thanh toán
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground ">
                          <span>Tạm tính</span>
                          <span>
                            {Number(subtotal).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>
                        {shippingFee > 0 && (
                          <div className="flex justify-between text-sm text-cyan-700 dark:text-cyan-300">
                            <span>Phí vận chuyển</span>
                            <span>
                              +{Number(shippingFee).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span>Giảm giá</span>
                            <span>
                              -
                              {Number(discountAmount).toLocaleString("vi-VN")}
                              đ
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                          <span>Tổng thanh toán</span>
                          <span className="text-primary">
                            {Number(selectedOrder.total_amount).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Phương thức:{" "}
                            <span className="font-medium text-foreground ">
                              {(selectedOrder.payment_method === "cash"
                                ? "Tiền mặt"
                                : "PayOS"
                              ).toUpperCase()}
                            </span>
                          </span>
                          {selectedOrder.is_paid ||
                            selectedOrder.payment?.status === "paid" ||
                            selectedOrder.payment?.status === "success" ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              Chưa thanh toán
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
