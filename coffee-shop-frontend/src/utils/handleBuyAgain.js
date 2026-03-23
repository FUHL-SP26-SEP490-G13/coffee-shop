import orderService from "@/services/orderOnlineService";
import { cartService } from "@/services/cartService";
import productService from "@/services/productService";

const defaultImage =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getCurrentProductImage = async (productId, fallbackImage) => {
  if (!productId) return fallbackImage;

  try {
    const res = await productService.getById(productId);
    const product = res?.data?.data || res?.data || {};
    const images = Array.isArray(product?.images) ? product.images : [];

    if (images.length === 0) {
      return fallbackImage;
    }

    const thumbnail =
      images.find((image) => Number(image?.isThumbnail ?? 0) === 1) ||
      images[0];

    return thumbnail?.image_url || fallbackImage;
  } catch {
    return fallbackImage;
  }
};

export async function handleBuyAgain(orderId, navigate) {
  try {
    const res = await orderService.getMyOrderDetail(orderId);
    const payload = res?.data?.data || res?.data || {};
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (items.length === 0) {
      alert("Đơn hàng này không có sản phẩm để mua lại");
      return;
    }

    for (const item of items) {
      const normalizedToppings = Array.isArray(item.toppings)
        ? item.toppings.map((topping) => ({
            topping_id: Number(topping.topping_id),
            name: topping.name,
            price: toNumber(topping.price),
            quantity: Math.max(1, Number(topping.quantity) || 1),
          }))
        : [];

      const toppingsTotal = normalizedToppings.reduce(
        (sum, topping) =>
          sum + toNumber(topping.price) * Math.max(1, Number(topping.quantity) || 1),
        0
      );

      const explicitBasePrice = toNumber(
        item.base_price ?? item.basePrice ?? item.product_size_price,
        NaN
      );
      const unitPriceFromOrder = toNumber(
        item.unit_price ?? item.price ?? item.total_price,
        0
      );

      const basePrice = Number.isFinite(explicitBasePrice)
        ? explicitBasePrice
        : Math.max(0, unitPriceFromOrder - toppingsTotal);

      const productId = Number(item.product_id) || Number(item.productId) || 0;
      const image = await getCurrentProductImage(
        productId,
        item.image_url || defaultImage
      );

      cartService.addItem({
        id: productId,
        product_id: productId,
        productId: productId,
        productSizeId: item.product_size_id,
        product_size_id: item.product_size_id,
        name: item.name,
        image,
        size: item.size,
        price: basePrice,
        basePrice: basePrice,
        quantity: Math.max(1, Number(item.quantity) || 1),
        toppings: normalizedToppings,
      });
    }

    alert("Đã thêm lại sản phẩm của đơn cũ vào giỏ hàng");
    navigate("/cart");
  } catch (error) {
    console.error("Buy again error:", error);
    alert(error?.response?.data?.message || "Không thể mua lại đơn hàng");
  }
}
