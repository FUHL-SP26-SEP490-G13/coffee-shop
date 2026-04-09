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
import PaginationControl from "../../../components/common/PaginationControl";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [orderCodeFilter, setOrderCodeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
          page: currentPage,
          limit: 10,
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
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalCount || 0);
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        toast.error("Không thể lấy danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [
    currentPage,
    statusFilter,
    orderTypeFilter,
    orderCodeFilter,
    startDateFilter,
    endDateFilter,
    isInvalidDateRange,
  ]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1); // reset to page 1 always on filter change
  };

  const handleOrderTypeChange = (val) => {
    setOrderTypeFilter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setOrderTypeFilter("all");
    setOrderCodeFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  const getStatusInfo = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return {
          key: "pending",
          label: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "preparing":
        return {
          key: "preparing",
          label: "Đang chuẩn bị",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "ready":
        return {
          key: "ready",
          label: "Chờ giao/Nhận",
          color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        };
      case "completed":
        return {
          key: "completed",
          label: "Hoàn thành",
          color: "bg-green-100 text-green-800 border-green-200",
        };
      case "cancelled":
        return {
          key: "cancelled",
          label: "Đã hủy",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          key: String(status).toLowerCase(),
          label: status,
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  const getOrderTypeInfo = (type) => {
    switch (String(type).toLowerCase()) {
      case "dine-in":
        return {
          label: "Tại quán",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "takeaway":
        return {
          label: "Mang đi",
          color: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "delivery":
        return {
          label: "Giao hàng",
          color: "bg-cyan-100 text-cyan-800 border-cyan-200",
        };
      default:
        return { label: type, color: "bg-slate-100 text-slate-800" };
    }
  };

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
      ready: 0,
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
    { value: "ready", label: "Chờ giao/Nhận" },
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

        <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Mã đơn</p>
              <Input
                value={orderCodeFilter}
                onChange={(e) => {
                  setOrderCodeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Ví dụ: 1025 hoặc #01025"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Từ ngày</p>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                max={endDateFilter || undefined}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Đến ngày</p>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                min={startDateFilter || undefined}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Trạng thái</p>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn hàng</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                  <SelectItem value="ready">Chờ giao/Nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Loại đơn</p>
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
              <p className="text-xs text-gray-500">
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
            <button
              key={filter.value}
              type="button"
              onClick={() => handleStatusChange(filter.value)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${isActive
                  ? "border-primary/40 bg-primary/5"
                  : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
            >
              <p
                className={`text-xs font-medium ${isActive ? "text-primary" : "text-gray-500"
                  }`}
              >
                {filter.label}
              </p>
              <p className="text-xl font-bold text-gray-900 leading-tight mt-1">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-64 rounded-2xl border bg-white flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <span className="text-sm font-medium">
              Đang tải danh sách đơn hàng...
            </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="h-64 rounded-2xl border bg-white flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="p-4 bg-gray-50 rounded-full">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <span className="text-sm font-medium">Chưa có đơn hàng nào</span>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Mã đơn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Món
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Khách
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
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
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                            #{String(order.id).padStart(5, "0")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">
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
                          <p className="font-medium text-gray-800 leading-5">
                            {itemCount} món
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate" title={itemPreview || "Không có sản phẩm"}>
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
                          <p className="text-sm font-medium text-gray-800 leading-5">
                            {customerName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
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

      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={10}
        itemName="đơn hàng"
      />

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
              <DialogHeader className="p-6 border-b bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-sm">
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
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 dark:border-gray-800 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <User className="w-4 h-4" />
                      Thông tin đơn hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trạng thái:</span>
                        <span className="font-medium text-gray-900">
                          {getStatusInfo(selectedOrder.status).label}
                        </span>
                      </div>

                      {(selectedOrder.receiver_name ||
                        selectedOrder.receiver_phone ||
                        selectedOrder.receiver_email) && (
                        <div className="pt-2 border-t border-dashed border-gray-100" />
                      )}

                      {selectedOrder.receiver_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tên nhận:</span>
                          <span className="font-medium text-gray-900">
                            {selectedOrder.receiver_name}
                          </span>
                        </div>
                      )}
                      {selectedOrder.receiver_phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">SĐT:</span>
                          <span className="font-medium text-gray-900">
                            {selectedOrder.receiver_phone}
                          </span>
                        </div>
                      )}
                      {selectedOrder.receiver_email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium text-gray-900">
                            {selectedOrder.receiver_email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 dark:border-gray-800 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <MapPin className="w-4 h-4" />
                      Chi tiết nhận hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.address ? (
                        <div>
                          <span className="text-gray-500 block mb-1">
                            Địa chỉ:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                            {selectedOrder.address}
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Hình thức:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {getOrderTypeInfo(selectedOrder.order_type).label}
                          </span>
                        </div>
                      )}
                      {selectedOrder.note && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 block mb-1">
                            Ghi chú giao hàng:
                          </span>
                          <span className="text-gray-800 dark:text-gray-100 bg-yellow-50/50 p-2 rounded block">
                            {selectedOrder.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                {/* Items List */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 text-primary font-medium">
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
                            className="p-4 flex justify-between gap-4 bg-white dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/30 transition-colors"
                          >
                            <div className="flex gap-3">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 w-6 h-6 flex items-center justify-center rounded text-sm shrink-0">
                                {item.quantity}
                              </span>
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100 leading-none">
                                  {item.product?.name || "Sản phẩm"}
                                  <span className="ml-2 font-normal text-gray-500">
                                    (
                                    {Number(baseDrinkPrice).toLocaleString(
                                      "vi-VN",
                                    )}
                                    đ)
                                  </span>
                                </p>
                                {item.size && (
                                  <p className="text-xs text-gray-500">
                                    Size:{" "}
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {item.size}
                                    </span>
                                  </p>
                                )}
                                {toppings.length > 0 && (
                                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-0.5 mt-1">
                                    {toppings.map((t, idx) => (
                                      <li key={idx}>
                                        <span className="text-gray-700 dark:text-gray-200">
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
                              <p className="font-medium text-gray-900 dark:text-gray-100">
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
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium pb-2 border-b border-gray-200 dark:border-gray-700">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
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
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Tổng thanh toán</span>
                    <span className="text-primary">
                      {Number(selectedOrder.total_amount).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Phương thức:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
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
