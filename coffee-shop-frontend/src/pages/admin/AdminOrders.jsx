import { useState, useEffect } from "react";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
          label: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "preparing":
        return {
          label: "Đang chuẩn bị",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "completed":
        return {
          label: "Hoàn thành",
          color: "bg-green-100 text-green-800 border-green-200",
        };
      case "cancelled":
        return {
          label: "Đã hủy",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return { label: status, color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100" };
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Quản lý Đơn hàng
            </h1>
          </div>
          <p className="text-sm text-muted-foreground dark:text-gray-400 ml-[52px]">
            Theo dõi và cập nhật trạng thái các đơn hàng trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto bg-white dark:bg-gray-900 dark:border-gray-800 p-1 rounded-xl border shadow-sm">
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
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 dark:border-gray-800 rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300 w-[120px]">
                  Mã đơn
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Sản phẩm
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Loại đơn
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Trạng thái
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300">
                  Thời gian
                </TableHead>
                <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-right">
                  Tổng tiền
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground dark:text-gray-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                      <span className="text-sm font-medium">
                        Đang tải danh sách đơn hàng...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground dark:text-gray-400 gap-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium">
                        Chưa có đơn hàng nào
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const typeInfo = getOrderTypeInfo(order.order_type);

                  return (
                    <TableRow
                      key={order.id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs">
                          #{String(order.id).padStart(5, "0")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[280px]">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item, i) => {
                                const itemToppings = Array.isArray(
                                  item.toppings,
                                )
                                  ? item.toppings
                                  : Array.isArray(item.toppings_raw)
                                    ? item.toppings_raw.filter((t) => t)
                                    : [];
                                return (
                                  <div
                                    key={i}
                                    className="flex flex-col text-sm gap-0.5 mb-1"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-xs min-w-[24px] text-center">
                                        {item.quantity}x
                                      </span>
                                      <span
                                        className="truncate text-gray-800 dark:text-gray-100"
                                        title={item.product?.name}
                                      >
                                        {item.product?.name || "Sản phẩm"}
                                      </span>
                                    </div>
                                    {itemToppings.length > 0 && (
                                      <div
                                        className="text-[11px] text-gray-500 pl-8 leading-tight line-clamp-1"
                                        title={itemToppings
                                          .map((t) => t.name)
                                          .join(", ")}
                                      >
                                        +{" "}
                                        {itemToppings
                                          .map((t) => t.name)
                                          .join(", ")}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {order.items.length > 2 && (
                                <div className="text-xs text-muted-foreground dark:text-gray-400 font-medium pl-1">
                                  + {order.items.length - 2} sản phẩm khác
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Không có sản phẩm
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-medium ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-medium ${statusInfo.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0 opacity-75" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <CalendarClock className="w-4 h-4 mr-1.5 text-gray-400 shrink-0" />
                          <span>
                            {new Date(order.created_at).toLocaleString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-primary">
                          {Number(order.total_amount).toLocaleString("vi-VN")}đ
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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

              <div className="p-6 space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 dark:border-gray-800 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-gray-50 pb-2">
                      <User className="w-4 h-4" />
                      Thông tin đơn hàng
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Loại đơn:</span>
                        <span className="font-medium text-gray-900">
                          {getOrderTypeInfo(selectedOrder.order_type).label}
                        </span>
                      </div>
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
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium pb-2 border-b border-gray-200 dark:border-gray-700">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
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
                  <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
