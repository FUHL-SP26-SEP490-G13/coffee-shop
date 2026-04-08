import { useState, useEffect, useMemo } from "react";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  ShoppingBag,
  Loader2,
  CalendarClock,
  Eye,
  Package,
  CreditCard,
  User,
  MapPin,
  ReceiptText,
} from "lucide-react";
import orderService from "../../services/orderService";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import PaginationControl from "../../components/common/PaginationControl";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getAllOrders({
          page: currentPage,
          limit: 10,
          status: statusFilter,
        });
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
  }, [currentPage, statusFilter]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1); // reset to page 1 always on filter change
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Quản lý Đơn hàng
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Theo dõi và cập nhật trạng thái các đơn hàng trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-1 rounded-xl border shadow-sm">
          <span className="text-sm font-medium text-gray-500 pl-3">
            Trạng thái:
          </span>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px] border-0 shadow-none focus:ring-0 bg-transparent">
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
          orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const typeInfo = getOrderTypeInfo(order.order_type);
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;

            return (
              <div
                key={order.id}
                className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-4 sm:p-5 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                          #{String(order.id).padStart(5, "0")}
                        </span>
                        <Badge variant="outline" className={`font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`font-medium inline-flex items-center ${statusInfo.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0 opacity-75" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarClock className="w-4 h-4 mr-1.5 text-gray-400 shrink-0" />
                        {new Date(order.created_at).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-500">Tổng thanh toán</p>
                      <p className="text-xl font-bold text-primary leading-tight">
                        {Number(order.total_amount).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-7 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Package className="w-4 h-4 text-gray-500" />
                      Sản phẩm ({itemCount})
                    </div>

                    {itemCount > 0 ? (
                      <div className="space-y-2.5">
                        {order.items.slice(0, 3).map((item, i) => {
                          const itemToppings = Array.isArray(item.toppings)
                            ? item.toppings
                            : Array.isArray(item.toppings_raw)
                              ? item.toppings_raw.filter((t) => t)
                              : [];

                          return (
                            <div key={i} className="text-sm space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-gray-800 truncate">
                                  {item.quantity}x {item.product?.name || "Sản phẩm"}
                                </p>
                                <p className="text-gray-700 font-semibold shrink-0">
                                  {Number(
                                    Number(item.price || 0) * Number(item.quantity || 0),
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </p>
                              </div>
                              {itemToppings.length > 0 && (
                                <p className="text-xs text-gray-500 pl-1 truncate">
                                  + {itemToppings.map((t) => t.name).join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {itemCount > 3 && (
                          <p className="text-xs text-muted-foreground font-medium">
                            + {itemCount - 3} sản phẩm khác
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        Không có sản phẩm
                      </span>
                    )}
                  </div>

                  <div className="lg:col-span-5 space-y-3">
                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Khách hàng
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {order.receiver_name || "Khách lẻ"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.receiver_phone || "Không có số điện thoại"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-3.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Thanh toán
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Tạm tính</span>
                        <span>
                          {Number(calculateSubtotal(order)).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mt-1.5">
                        <span>Thực thu</span>
                        <span className="text-primary">
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center justify-end">
                  <Button
                    variant="outline"
                    className="h-9"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            );
          })
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedOrder && (
            <>
              <DialogHeader className="p-6 border-b bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
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

              <div className="p-6 space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <User className="w-4 h-4" />
                      Thông tin khách hàng
                    </div>
                    {selectedOrder.receiver_name ||
                      selectedOrder.receiver_phone ? (
                      <div className="space-y-2 text-sm">
                        {selectedOrder.receiver_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tên:</span>
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
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        Không có thông tin
                      </span>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3 shadow-sm">
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
                          <p className="font-medium text-gray-900 leading-relaxed">
                            {selectedOrder.address}
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Hình thức:</span>
                          <span className="font-medium text-gray-900">
                            {getOrderTypeInfo(selectedOrder.order_type).label}
                          </span>
                        </div>
                      )}
                      {selectedOrder.note && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                          <span className="text-gray-500 block mb-1">
                            Ghi chú giao hàng:
                          </span>
                          <span className="text-gray-800 bg-yellow-50/50 p-2 rounded block">
                            {selectedOrder.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gray-50/50 p-3 border-b border-gray-100 flex items-center gap-2 text-primary font-medium">
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
                            className="p-4 flex justify-between gap-4 bg-white hover:bg-gray-50/30 transition-colors"
                          >
                            <div className="flex gap-3">
                              <span className="font-semibold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded text-sm shrink-0">
                                {item.quantity}
                              </span>
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900 leading-none">
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
                                    <span className="font-medium text-gray-700">
                                      {item.size}
                                    </span>
                                  </p>
                                )}
                                {toppings.length > 0 && (
                                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-0.5 mt-1">
                                    {toppings.map((t, idx) => (
                                      <li key={idx}>
                                        <span className="text-gray-700">
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
                              <p className="font-medium text-gray-900">
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
                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 font-medium pb-2 border-b border-gray-200">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính</span>
                    <span>
                      {Number(calculateSubtotal(selectedOrder)).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>
                  {Number(calculateSubtotal(selectedOrder)) >
                    Number(selectedOrder.total_amount) && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Giảm giá</span>
                        <span>
                          -
                          {Number(
                            calculateSubtotal(selectedOrder) -
                            selectedOrder.total_amount,
                          ).toLocaleString("vi-VN")}
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
                      <span className="font-medium text-gray-700">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
