import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, RotateCcw, CheckCircle2, Package, Truck, ClipboardList, XCircle, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import orderService from "@/services/orderOnlineService";
import { handleBuyAgain } from "@/utils/handleBuyAgain";
import { useStoreHours } from "@/hooks/useStoreHours";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const defaultProductImage =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";
const DEFAULT_DELIVERY_FEE = 20000;

export default function MyOrderDetailPage() {
  const { id } = useParams();
  useDocumentTitle(`Chi tiết đơn hàng #${id || ''}`);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyAgainLoading, setBuyAgainLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { isOpen } = useStoreHours();

  const fetchOrderDetail = useCallback(async () => {
    try {
      const res = await orderService.getMyOrderDetail(id);
      const data = res?.data?.data || res?.data || null;
      setOrder(data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn hàng:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id, fetchOrderDetail]);

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case "delivery":
        return "Giao hàng";
      case "takeaway":
        return "Mang đi";
      case "dine-in":
        return "Tại quán";
      default:
        return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "preparing":
        return "Đang chuẩn bị";
      case "served":
        return "Đã phục vụ";
      case "delivering":
        return "Đang giao";
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
      case "served":
        return "bg-indigo-100 text-indigo-700";
      case "delivering":
        return "bg-cyan-100 text-cyan-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const onBuyAgain = async () => {
    try {
      setBuyAgainLoading(true);
      await handleBuyAgain(id, navigate);
    } finally {
      setBuyAgainLoading(false);
    }
  };

  const isPaidOrder =
    Number(order?.is_paid) === 1 ||
    String(order?.payment_status || "").toLowerCase() === "paid";

  const canCancelOrder = ["pending"].includes(order?.status) && !isPaidOrder;

  const onCancelOrder = async () => {
    if (!id || !canCancelOrder) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy đơn hàng này không?"
    );
    if (!confirmed) return;

    try {
      setCancelLoading(true);
      await orderService.cancel(id);
      await fetchOrderDetail();
      alert("Đã hủy đơn hàng thành công");
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">
          Không tìm thấy chi tiết đơn hàng
        </div>
        <Footer />
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const shippingFee =
    order.order_type === "delivery"
      ? Number(order.shipping_fee ?? DEFAULT_DELIVERY_FEE)
      : 0;

  const getItemQuantity = (item) => Math.max(1, Number(item?.quantity) || 1);

  const getItemUnitPrice = (item) =>
    Number(item?.unit_price ?? item?.price ?? 0);

  const getToppingUnitTotal = (item) =>
    (item?.toppings || []).reduce(
      (sum, topping) =>
        sum + Number(topping?.price || 0) * Number(topping?.quantity || 0),
      0,
    );

  const getBaseUnitPrice = (item) => {
    const fromApi = Number(item?.base_unit_price);
    if (Number.isFinite(fromApi) && fromApi >= 0) return fromApi;
    return Math.max(0, getItemUnitPrice(item) - getToppingUnitTotal(item));
  };

  const getItemLineTotal = (item) => {
    const lineTotal = Number(item?.line_total);
    if (Number.isFinite(lineTotal) && lineTotal >= 0) return lineTotal;
    return getItemUnitPrice(item) * getItemQuantity(item);
  };

  const getTimelineSteps = () => {
    const isCancelled = order.status === "cancelled";

    let steps = [
      { id: "pending", label: "Chờ xác nhận", icon: ClipboardList },
      { id: "preparing", label: "Đang chuẩn bị", icon: Package },
    ];

    if (order.order_type === "delivery") {
      steps.push({ id: "delivering", label: "Đang giao", icon: Truck });
    } else {
      steps.push({ id: "served", label: "Hoàn thành món", icon: Check });
    }
    steps.push({ id: "completed", label: "Hoàn tất", icon: CheckCircle2 });

    if (isCancelled) {
      steps = [
        { id: "pending", label: "Chờ xác nhận", icon: ClipboardList },
        { id: "cancelled", label: "Đã hủy", icon: XCircle }
      ];
    }
    return steps;
  };

  const getStepStatus = (stepId, index, steps) => {
    if (order.status === "cancelled") {
      return stepId === "cancelled" ? "current" : "completed";
    }
    const currentStatusIndex = steps.findIndex(s => s.id === order.status);
    if (index < currentStatusIndex) return "completed";
    if (index === currentStatusIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/my-orders")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại đơn hàng
          </Button>

          <div className="border rounded-2xl bg-white dark:bg-gray-900 p-5 sm:p-8 shadow-sm">
            {/* Timeline */}
            <div className="mb-8 sm:mb-12 relative pt-2">
              <div className="flex items-center justify-between relative z-10 w-full max-w-3xl mx-auto px-2">
                {getTimelineSteps().map((step, idx, arr) => {
                  const status = getStepStatus(step.id, idx, arr);
                  const Icon = step.icon;
                  const isLast = idx === arr.length - 1;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative flex-1 text-center group">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 z-10 bg-white dark:bg-gray-900 shadow-sm
                        ${status === 'completed' ? 'border-amber-500 bg-amber-500 text-white' :
                          status === 'current' ? (step.id === 'cancelled' ? 'border-red-500 bg-red-100 dark:bg-red-900/40 text-red-600' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/40 text-amber-600 ring-4 ring-amber-100 dark:ring-amber-900/50') :
                            'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-900'}`}
                      >
                        <Icon strokeWidth={status === 'completed' ? 3 : 2} className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className={`mt-2 sm:mt-3 text-[10px] sm:text-[13px] font-bold tracking-tight transition-colors duration-300 max-w-[70px] sm:max-w-none break-words
                        ${status === 'completed' || status === 'current' ? (step.id === 'cancelled' ? 'text-red-600' : 'text-gray-900 dark:text-gray-100') : 'text-gray-400 dark:text-gray-500'}`}>
                        {step.label}
                      </span>

                      {/* Connecting Line */}
                      {!isLast && (
                        <div className={`absolute top-5 sm:top-6 left-[50%] right-[-50%] h-[2px] sm:h-[3px] transition-colors duration-500 -z-10
                          ${status === 'completed' ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 border-t border-gray-100 dark:border-gray-800 pt-8">
              {/* Order Info */}
              <div className="lg:col-span-7">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 sm:mb-6 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                  Thông tin đơn hàng
                </h1>

                <div className="space-y-4 text-[13px] sm:text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                    <span className="text-gray-500 dark:text-gray-400">Mã đơn hàng</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">#{order.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                    <span className="text-gray-500 dark:text-gray-400">Ngày tạo</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                    <span className="text-gray-500 dark:text-gray-400">Hình thức</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                      {getOrderTypeLabel(order.order_type)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                    <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                    <span className="text-gray-500 dark:text-gray-400">Thanh toán</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${Number(order.is_paid) === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {Number(order.is_paid) === 1 ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </div>
                  {order.payment_method && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 border-dashed">
                      <span className="text-gray-500 dark:text-gray-400">Phương thức</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {order.payment_method === "cash" ? "Tiền mặt" : order.payment_method === "payos" ? "Chuyển khoản (PayOS)" : order.payment_method}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt */}
              <div className="lg:col-span-5 bg-amber-50/60 dark:bg-gray-800/60 rounded-[1.5rem] p-6 border border-amber-100/50 dark:border-gray-700 relative overflow-hidden shadow-sm">
                <div className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-r border-amber-100/50 dark:border-gray-700 shadow-inner"></div>
                <div className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-l border-amber-100/50 dark:border-gray-700 shadow-inner"></div>

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Hóa đơn thanh toán</h3>

                <div className="space-y-3.5 text-sm border-b-2 border-dashed border-gray-200 dark:border-gray-700 pb-8 mb-6 mt-4">
                  <div className="flex justify-between font-medium text-gray-600 dark:text-gray-300">
                    <span>Tạm tính</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {(Number(order.total_amount || 0) + (Number(order.discount_amount || 0)) + (Number(order.loyalty_discount_amount || 0)) - shippingFee).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="flex justify-between font-medium text-gray-600 dark:text-gray-300">
                      <span>Phí vận chuyển</span>
                      <span className="text-gray-900 dark:text-gray-100">+{shippingFee.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  {Number(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span>Voucher giảm giá</span>
                      <span>-{Number(order.discount_amount).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  {Number(order.loyalty_discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span>Điểm thành viên</span>
                      <span>-{Number(order.loyalty_discount_amount).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Tổng cộng</span>
                  <span className="text-xl font-black text-amber-600 leading-none drop-shadow-sm">
                    {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>

            {(order.receiver_name ||
              order.receiver_phone ||
              order.receiver_email ||
              order.address ||
              order.note) && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Thông tin nhận hàng
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    {order.receiver_name && (
                      <p>
                        Người nhận:{" "}
                        <span className="font-medium">{order.receiver_name}</span>
                      </p>
                    )}

                    {order.receiver_phone && (
                      <p>
                        Số điện thoại:{" "}
                        <span className="font-medium">
                          {order.receiver_phone}
                        </span>
                      </p>
                    )}

                    {order.receiver_email && (
                      <p>
                        Email:{" "}
                        <span className="font-medium">
                          {order.receiver_email}
                        </span>
                      </p>
                    )}

                    {order.address && (
                      <p className="md:col-span-2">
                        Địa chỉ:{" "}
                        <span className="font-medium">{order.address}</span>
                      </p>
                    )}

                    {order.note && (
                      <p className="md:col-span-2">
                        Ghi chú: <span className="font-medium">{order.note}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

            <div className="mt-8 border-t pt-6">
              <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sản phẩm đã đặt
              </h2>

              {items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đơn hàng chưa có sản phẩm
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-950"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image_url || defaultProductImage}
                            alt={item.name}
                            onClick={() => navigate(`/products/${item.product_id}`)}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer hover:opacity-80 transition-opacity"
                          />

                          <div>
                            <p className="text-md font-semibold text-gray-900 dark:text-gray-100">
                              {item.name}
                            </p>

                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p>Size: {item.size}</p>
                              <p>Số lượng: {item.quantity}</p>
                              <p>
                                Đơn giá:{" "}
                                {getBaseUnitPrice(item).toLocaleString("vi-VN")}đ
                              </p>

                            </div>

                            {Array.isArray(item.toppings) &&
                              item.toppings.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Topping:
                                  </p>

                                  <div className="space-y-1">
                                    {item.toppings.map((topping) => (
                                      <p
                                        key={topping.id || topping.topping_id}
                                        className="text-sm text-gray-600 dark:text-gray-400"
                                      >
                                        + {topping.name} x {getItemQuantity(item)} (
                                        {(
                                          Number(topping.price || 0) *
                                          getItemQuantity(item)
                                        ).toLocaleString("vi-VN")}
                                        đ)
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Thành tiền</p>
                          <p className="text-md font-semibold text-amber-600">
                            {getItemLineTotal(item).toLocaleString("vi-VN")}
                            đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
              {canCancelOrder && (
                <Button
                  variant="outline"
                  onClick={onCancelOrder}
                  disabled={cancelLoading}
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang hủy...
                    </>
                  ) : (
                    "Hủy đơn hàng"
                  )}
                </Button>
              )}

              <Button
                onClick={onBuyAgain}
                disabled={buyAgainLoading || !isOpen}
                className={`text-white ${!isOpen ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
                title={!isOpen ? "Cửa hàng đang đóng cửa" : ""}
              >
                {buyAgainLoading ? (
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
