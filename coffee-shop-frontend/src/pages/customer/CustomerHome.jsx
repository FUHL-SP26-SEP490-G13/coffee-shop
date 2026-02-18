import useFetch from "@/hooks/useFetch";
import orderService from "@/services/orderService";
import discountService from "@/services/discountService";

export default function CustomerHome() {
  const { data: orders } = useFetch(() => orderService.getMyOrders());
  const { data: discounts } = useFetch(() => discountService.getMyDiscounts());

  const lastOrder = orders?.data?.[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Tổng quan</h2>

      {lastOrder && (
        <div className="p-6 bg-white rounded-xl shadow">
          <h3 className="font-semibold mb-2">Đơn gần nhất</h3>
          <p>Mã đơn: #{lastOrder.id}</p>
          <p>Trạng thái: {lastOrder.status}</p>
          <p>Tổng tiền: {lastOrder.total_amount} đ</p>
        </div>
      )}

      <div className="p-6 bg-white rounded-xl shadow">
        <h3 className="font-semibold mb-2">Voucher của bạn</h3>
        <p>Bạn có {discounts?.data?.length || 0} voucher còn hiệu lực</p>
      </div>
    </div>
  );
}
