const CART_KEY = "cart_items";

const getItemSizeId = (item) =>
  Number(item?.productSizeId || item?.product_size_id || 0);

export const cartService = {
  getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

      if (!Array.isArray(cart)) return [];

      return cart.map((item) => {
        const normalizedId = getItemSizeId(item);

        return {
          ...item,
          productSizeId: normalizedId,
          product_size_id: normalizedId,
          quantity: Math.max(1, Number(item.quantity) || 1),
          price: Number(item.price) || 0,
        };
      });
    } catch {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  },

  addItem(item) {
    const cart = this.getCart();
    const normalizedId = getItemSizeId(item);

    const normalizedItem = {
      ...item,
      productSizeId: normalizedId,
      product_size_id: normalizedId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Number(item.price) || 0,
    };

    const index = cart.findIndex((x) => getItemSizeId(x) === normalizedId);

    if (index >= 0) {
      cart[index].quantity =
        Number(cart[index].quantity || 0) + normalizedItem.quantity;
    } else {
      cart.push(normalizedItem);
    }

    this.saveCart(cart);
  },

  updateQuantity(productSizeId, quantity) {
    const targetId = Number(productSizeId);

    const cart = this.getCart().map((item) => {
      if (getItemSizeId(item) === targetId) {
        return {
          ...item,
          productSizeId: targetId,
          product_size_id: targetId,
          quantity: Math.max(1, Number(quantity) || 1),
        };
      }
      return item;
    });

    this.saveCart(cart);
  },

  removeItem(productSizeId) {
    const targetId = Number(productSizeId);

    const cart = this.getCart().filter(
      (item) => getItemSizeId(item) !== targetId
    );

    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getTotalAmount() {
    return this.getCart().reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  },
};
