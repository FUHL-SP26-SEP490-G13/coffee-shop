import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import orderService from "@/services/orderOnlineService";
import { validateOrderForm } from "@/utils/orderValidation";

/**
 * Nút đặt hàng tái sử dụng cho cả trang Checkout (khách) lẫn Staff.
 *
 * Props:
 *  - form         {object}   Dữ liệu form đơn hàng (order_type, payment_method, receiver_name, ...)
 *  - cart         {Array}    Danh sách sản phẩm trong giỏ
 *  - totalAmount  {number}   Tổng tiền sau giảm giá
 *  - onValidateError(errors) Callback khi form không hợp lệ – nhận object lỗi để hiển thị
 *  - onSuccess()             Callback sau khi đặt hàng thành công bằng tiền mặt (tuỳ chọn)
 *  - backPath     {string}   Đường dẫn nút "quay lại" – truyền null/false để ẩn nút
 *  - backLabel    {string}   Nhãn nút quay lại
 *  - label        {string}   Nhãn nút đặt hàng
 */
export default function PlaceOrderButton({
  form,
  cart,
  totalAmount,
  onValidateError,
  onSuccess,
  backPath = "/cart",
  backLabel = "← Quay lại giỏ hàng",
  label = "Đặt hàng",
  disabled = false,
}) {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const formErrors = validateOrderForm(form);
    if (Object.keys(formErrors).length > 0) {
      onValidateError?.(formErrors);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        order_type: form.order_type,
        payment_method: form.payment_method,
        receiver_name: form.receiver_name.trim(),
        receiver_phone: form.receiver_phone.trim(),
        receiver_email: form.receiver_email.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        discount_code: (form.discount_code || "").trim(),
        used_points: Math.max(0, Number(form.used_points) || 0),
        items: cart.map((item) => ({
          product_size_id: item.productSizeId || item.product_size_id,
          quantity: Number(item.quantity),
          toppings: Array.isArray(item.toppings)
            ? item.toppings.map((topping) => ({
                topping_id: topping.topping_id,
                quantity: Number(topping.quantity || 1),
              }))
            : [],
        })),
      };

      console.log("Checkout payload:", payload);

      const orderRes = await orderService.checkout(payload);
      const orderData = orderRes?.data || {};
      const order_id = Number(orderData?.order_id);

      if (form.payment_method === "payos") {
        if (!order_id || Number.isNaN(order_id)) {
          alert("Không lấy được mã đơn hàng để tạo thanh toán PayOS");
          return;
        }

        const payosItems = cart.flatMap((item) => {
          const itemQuantity = Math.max(1, Number(item.quantity) || 1);
          const basePrice = Math.max(
            0,
            Math.round(Number(item.basePrice || item.price) || 0)
          );

          const productItem = {
            name: `${item.name} (${item.size})`,
            quantity: itemQuantity,
            price: basePrice,
          };

          const toppingItems = Array.isArray(item.toppings)
            ? item.toppings
                .filter((topping) => Number(topping.price) > 0)
                .map((topping) => ({
                  name: `Topping: ${topping.name}`,
                  quantity:
                    itemQuantity * Math.max(1, Number(topping.quantity) || 1),
                  price: Math.max(0, Math.round(Number(topping.price) || 0)),
                }))
            : [];

          return [productItem, ...toppingItems].filter(
            (payosItem) => payosItem.quantity > 0 && payosItem.price > 0
          );
        });

        const amountFromCheckout = Number(orderData?.total_amount || 0);

        const payosRes = await orderService.createPaymentLink({
          orderCode: order_id,
          amount: Math.max(
            0,
            Math.round(amountFromCheckout > 0 ? amountFromCheckout : totalAmount),
          ),
          description: `DH #${order_id}`.slice(0, 25),
          items: payosItems,
        });

        clearCart();
        const checkoutUrl = payosRes?.data?.checkoutUrl;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          alert("Không lấy được link thanh toán PayOS");
        }
      } else {
        clearCart();
        alert("Đặt hàng thành công");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        className="w-full mb-3"
        onClick={handleSubmit}
        disabled={submitting || disabled}
      >
        {submitting ? "Đang xử lý..." : label}
      </Button>

      {backPath && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(backPath)}
        >
          {backLabel}
        </Button>
      )}
    </>
  );
}
