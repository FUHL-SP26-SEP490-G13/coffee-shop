import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ShoppingBag,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import socket from "@/lib/socket";
import orderService from "@/services/orderOnlineService";
import flashSaleService from "@/services/flashSaleService";
import { handleBuyAgain } from "@/utils/handleBuyAgain";
import { useStoreHours } from "@/hooks/useStoreHours";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE = 5;
const LOYALTY_MONEY_PER_POINT = 100;
const LEGACY_DELIVERY_SHIPPING_FEE = 20000;
const MONEY_ROUNDING_UNIT = 100;
const DYNAMIC_SHIPPING_ROLLOUT_AT = new Date("2026-04-07T00:00:00.000Z").getTime();
const STATUS_TABS = [
  "pending",
  "preparing",
  "completed",
  "cancelled",
];

export default function MyOrderOnlinePage() {
  useDocumentTitle('Đơn hàng của tôi');
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyAgainLoadingId, setBuyAgainLoadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState(STATUS_TABS[0]);
  const [activeSale, setActiveSale] = useState(null);
  const { isOpen } = useStoreHours();

  useEffect(() => {
    flashSaleService
      .getCurrentActive()
      .then((res) => {
        setActiveSale(res?.data || null);
      })
      .catch((err) => console.error("Error fetching active sale:", err));
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        const list = res?.data || [];
        setOrders(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Lỗi lấy danh sách đơn hàng:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Socket listeners for real-time order updates
    const handlePaymentCompleted = (data) => {
      toast.success(`Thanh toán thành công cho đơn #${data.order_id}`);
      // Reload orders to reflect changes
      fetchOrders();
    };

    const handleStatusChanged = (data) => {
      toast.info(`📋 Đơn #${data.order_id} - ${data.message}`);
      // Reload orders to reflect changes
      fetchOrders();
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("order:payment-completed", handlePaymentCompleted);
    socket.on("order:status-changed", handleStatusChanged);

    return () => {
      socket.off("order:payment-completed", handlePaymentCompleted);
      socket.off("order:status-changed", handleStatusChanged);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.status === activeStatus);
  }, [orders, activeStatus]);

  const statusCountMap = useMemo(() => {
    return STATUS_TABS.reduce((acc, status) => {
      acc[status] = orders.filter((order) => order.status === status).length;
      return acc;
    }, {});
  }, [orders]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  }, [filteredOrders]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeStatus]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "preparing":
        return "Đang chuẩn bị";
      case "completed":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "preparing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getItemsSubtotal = (items) =>
    (Array.isArray(items) ? items : []).reduce((sum, item) => {
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      const unitPrice = Number(item?.price ?? item?.unit_price ?? 0);
      return sum + Math.max(0, unitPrice * quantity);
    }, 0);

  const shouldUseLegacyShippingFallback = (order) => {
    const createdAtMs = new Date(order?.created_at || 0).getTime();
    return Number.isFinite(createdAtMs) && createdAtMs < DYNAMIC_SHIPPING_ROLLOUT_AT;
  };

  const getShippingFee = (order) => {
    if (order.order_type !== "delivery") return 0;

    const feeFromApi = Number(order.shipping_fee);
    if (Number.isFinite(feeFromApi) && feeFromApi > 0) {
      return Math.round(feeFromApi / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
    }

    const loyaltyDiscount =
      Math.max(0, Number(order.used_points || 0)) * LOYALTY_MONEY_PER_POINT;
    const derivedFee =
      Number(order.total_amount || 0) + loyaltyDiscount - getItemsSubtotal(order.items);

    const normalizedDerivedFee =
      Math.round(derivedFee / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
    if (Number.isFinite(normalizedDerivedFee) && normalizedDerivedFee > 0) {
      return normalizedDerivedFee;
    }

    if (shouldUseLegacyShippingFallback(order)) {
      return LEGACY_DELIVERY_SHIPPING_FEE;
    }

    return 0;
  };

  const onBuyAgain = async (orderId) => {
    try {
      setBuyAgainLoadingId(orderId);
      await handleBuyAgain(orderId, navigate);
    } finally {
      setBuyAgainLoadingId(null);
    }
  };

  const renderPagination = () => {
    if (filteredOrders.length <= PAGE_SIZE) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }

    return (
      <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Trước
        </Button>

        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPage(item)}
            className={`min-w-10 h-10 px-3 rounded-lg border text-sm font-medium transition ${page === item
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-amber-500"
              }`}
          >
            {item}
          </button>
        ))}

        <Button
          variant="outline"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
        >
          Sau
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">


      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <span>Đơn hàng của tôi</span>
            </div>

            <Button variant="outline" onClick={() => navigate("/products")}>
              Tiếp tục mua hàng
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-gray-50 dark:bg-gray-950">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Bạn chưa có đơn hàng nào</p>
              <Button onClick={() => navigate("/products")}>Mua ngay</Button>
            </div>
          ) : (
            <>
              <div className="mb-6 overflow-x-auto">
                <div className="inline-flex items-center gap-2 min-w-max">
                  {STATUS_TABS.map((status) => {
                    const isActive = activeStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setActiveStatus(status)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition whitespace-nowrap ${isActive
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-amber-500"
                          }`}
                      >
                        {getStatusLabel(status)} ({statusCountMap[status] || 0})
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-14 border rounded-2xl bg-gray-50 dark:bg-gray-950">
                  <p className="text-gray-500 dark:text-gray-400">
                    Không có đơn hàng ở trạng thái {getStatusLabel(activeStatus)}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 transition-colors rounded-[1.5rem] p-5 sm:p-6 bg-white dark:bg-gray-900 shadow-sm relative overflow-hidden group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                        <div className="flex items-start gap-4 sm:gap-5 flex-1">
                          {/* Avatar Group */}
                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="flex -space-x-4 flex-shrink-0">
                              {order.items.slice(0, 3).map((item, idx) => {
                                const isFlashSale = activeSale?.product_ids?.includes(Number(item.product_id || item.id));
                                return (
                                  <div key={idx} className="relative" style={{ zIndex: 3 - idx }}>
                                    <img
                                      src={item.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"}
                                      alt={item.name}
                                      className="w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 rounded-full border-[3px] border-white dark:border-gray-900 object-cover bg-gray-50 dark:bg-gray-800 shadow-sm transition-transform duration-300 group-hover:-translate-y-1"
                                    />
                                    {isFlashSale && (
                                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm shadow-sm whitespace-nowrap z-10 transition-transform duration-300 group-hover:-translate-y-1">
                                        -{activeSale.discount_percent}%
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {order.items.length > 3 && (
                                <div
                                  className="w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 rounded-full border-[3px] border-white dark:border-gray-900 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 shadow-sm"
                                  style={{ zIndex: 0 }}
                                >
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex-1 mt-1">
                            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 transition-colors group-hover:text-amber-600" style={{ fontFamily: 'serif' }}>
                              {Array.isArray(order.items) && order.items.length > 0
                                ? `${order.items[0].name}${order.items.length > 1 ? ` và ${order.items.length - 1} sản phẩm khác` : ""}`
                                : "Đơn hàng trực tuyến"}
                            </p>

                            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60"></div>
                                  {order.order_type === "delivery"
                                    ? "Giao hàng"
                                    : order.order_type === "takeaway"
                                      ? "Mang đi"
                                      : "Tại bàn"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${Number(order.is_paid) === 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  {Number(order.is_paid) === 1
                                    ? <span className="text-green-600 dark:text-green-500">Đã thanh toán</span>
                                    : <span className="opacity-70">Chưa thanh toán</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs opacity-70">
                                <Clock className="w-3.5 h-3.5" />
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })
                                  : "--"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end justify-between items-start gap-4 border-t border-gray-100 dark:border-gray-800 sm:border-0 pt-4 sm:pt-0 min-w-[140px]">
                          <div className="flex items-center justify-between w-full sm:justify-end">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="flex flex-row sm:flex-col sm:text-right items-end justify-between w-full sm:w-auto mt-auto gap-2">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold hidden sm:block">Tổng tiền</p>
                            <p className="text-xl font-black text-amber-600 leading-none">
                              {Number(order.total_amount || 0).toLocaleString(
                                "vi-VN"
                              )}
                              đ
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/my-orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </Button>

                        <Button
                          onClick={() => onBuyAgain(order.id)}
                          disabled={buyAgainLoadingId === order.id || !isOpen}
                          className={`text-white ${!isOpen ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
                          title={!isOpen ? "Cửa hàng đang đóng cửa" : ""}
                        >
                          {buyAgainLoadingId === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang thêm...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              {isOpen ? "Mua lại" : "Đã đóng cửa"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {renderPagination()}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
