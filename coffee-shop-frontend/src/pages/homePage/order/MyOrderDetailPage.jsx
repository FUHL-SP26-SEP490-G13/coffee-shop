import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import orderService from "@/services/orderOnlineService";
import { handleBuyAgain } from "@/utils/handleBuyAgain";
import { useStoreHours } from "@/hooks/useStoreHours";

const defaultProductImage =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";
const DEFAULT_DELIVERY_FEE = 20000;

export default function MyOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

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

          <div className="border rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Đơn hàng #{order.id}
                </h1>

                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Loại đơn:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getOrderTypeLabel(order.order_type)}
                    </span>
                  </p>

                  <p>
                    Trạng thái:{" "}
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </p>

                  <p>
                    Thanh toán:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Number(order.is_paid) === 1
                        ? "Đã thanh toán"
                        : "Chưa thanh toán"}
                    </span>
                  </p>

                  <p>
                    Ngày tạo:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString("vi-VN")
                        : "--"}
                    </span>
                  </p>

                  {order.payment_method && (
                    <p>
                      Phương thức thanh toán:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {order.payment_method === "cash" ? "Tiền mặt" : order.payment_method === "payos" ? "Chuyển khoản bằng mã QR với dịch vụ PayOS" : order.payment_method}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng cộng</p>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Phí vận chuyển: <strong>+{shippingFee.toLocaleString("vi-VN")}đ</strong>
                  </p>
                )}
                <p className="text-3xl font-bold text-amber-600">
                  {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            {(order.receiver_name ||
              order.receiver_phone ||
              order.receiver_email ||
              order.address ||
              order.note) && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          />

                          <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                          <p className="text-lg font-bold text-amber-600">
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
                    {isOpen ? "Mua lại đơn này" : "Đã đóng cửa"}
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
