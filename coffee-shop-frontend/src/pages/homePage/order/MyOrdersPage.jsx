import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ShoppingBag,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import orderService from "@/services/orderService";
import { handleBuyAgain } from "@/utils/handleBuyAgain";

const PAGE_SIZE = 5;

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyAgainLoadingId, setBuyAgainLoadingId] = useState(null);
  const [page, setPage] = useState(1);

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
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  }, [orders]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return orders.slice(start, end);
  }, [orders, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
        return "bg-gray-100 text-gray-700";
    }
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
    if (orders.length <= PAGE_SIZE) return null;

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
            className={`min-w-10 h-10 px-3 rounded-lg border text-sm font-medium transition ${
              page === item
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-amber-500"
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">
              Đơn hàng của tôi
            </h1>

            <Button variant="outline" onClick={() => navigate("/products")}>
              Tiếp tục mua hàng
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-gray-50">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
              <Button onClick={() => navigate("/products")}>Mua ngay</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-2xl p-5 bg-white"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          Đơn hàng #{order.id}
                        </p>

                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <p>
                            Loại đơn:{" "}
                            <span className="text-gray-800 font-medium">
                              {order.order_type === "delivery"
                                ? "Giao hàng"
                                : order.order_type === "takeaway"
                                ? "Mang đi"
                                : "Tại bàn"}
                            </span>
                          </p>

                          <p>
                            Thanh toán:{" "}
                            <span className="text-gray-800 font-medium">
                              {Number(order.is_paid) === 1
                                ? "Đã thanh toán"
                                : "Chưa thanh toán"}
                            </span>
                          </p>

                          <p>
                            Ngày tạo:{" "}
                            <span className="text-gray-800 font-medium">
                              {order.created_at
                                ? new Date(order.created_at).toLocaleString(
                                    "vi-VN"
                                  )
                                : "--"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>

                        <p className="mt-3 text-xl font-bold text-amber-600">
                          {Number(order.total_amount || 0).toLocaleString(
                            "vi-VN"
                          )}
                          đ
                        </p>
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
                        disabled={buyAgainLoadingId === order.id}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {buyAgainLoadingId === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang thêm...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Mua lại
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
