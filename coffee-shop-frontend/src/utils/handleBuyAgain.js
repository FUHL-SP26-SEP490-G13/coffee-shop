import orderService from "@/services/orderService";
import { cartService } from "@/services/cartService";

const defaultImage =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

export async function handleBuyAgain(orderId, navigate) {
  try {
    const res = await orderService.getMyOrderDetail(orderId);
    const payload = res?.data?.data || res?.data || {};
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (items.length === 0) {
      alert("Đơn hàng này không có sản phẩm để mua lại");
      return;
    }

    items.forEach((item) => {
      cartService.addItem({
        id: item.product_id,
        product_id: item.product_id,
        productId: item.product_id,
        productSizeId: item.product_size_id,
        product_size_id: item.product_size_id,
        name: item.name,
        image: item.image_url || defaultImage,
        size: item.size,
        price: Number(item.base_price || 0),
        basePrice: Number(item.base_price || 0),
        quantity: Math.max(1, Number(item.quantity) || 1),
        toppings: Array.isArray(item.toppings)
          ? item.toppings.map((topping) => ({
              topping_id: Number(topping.topping_id),
              name: topping.name,
              price: Number(topping.price) || 0,
              quantity: Math.max(1, Number(topping.quantity) || 1),
            }))
          : [],
      });
    });

    alert("Đã thêm lại sản phẩm của đơn cũ vào giỏ hàng");
    navigate("/cart");
  } catch (error) {
    console.error("Buy again error:", error);
    alert(error?.response?.data?.message || "Không thể mua lại đơn hàng");
  }
}
