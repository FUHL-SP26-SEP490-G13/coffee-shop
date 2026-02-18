import useFetch from "@/hooks/useFetch";
import orderService from "@/services/orderService";

export default function CustomerOrders() {
  const { data, loading } = useFetch(() => orderService.getMyOrders());

  const orders = data?.data || [];

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Đơn hàng của tôi</h2>

      {orders.map((order) => (
        <div key={order.id} className="p-4 bg-white shadow rounded-xl mb-4">
          <p>Mã đơn: #{order.id}</p>
          <p>Trạng thái: {order.status}</p>
          <p>Tổng tiền: {order.total_amount} đ</p>
        </div>
      ))}
    </div>
  );
}
