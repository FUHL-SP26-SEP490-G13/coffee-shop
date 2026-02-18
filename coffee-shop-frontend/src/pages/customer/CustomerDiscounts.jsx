import useFetch from "@/hooks/useFetch";
import discountService from "@/services/discountService";

export default function CustomerDiscounts() {
  const { data } = useFetch(() => discountService.getMyDiscounts());

  const vouchers = data?.data || [];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Voucher của tôi</h2>

      {vouchers.map((voucher) => (
        <div key={voucher.id} className="p-4 bg-white shadow rounded-xl mb-4">
          <p>Mã: {voucher.code}</p>
          <p>Giảm: {voucher.percentage}%</p>
        </div>
      ))}
    </div>
  );
}
