const CART_KEY = "cart_items";

const cartService = {
  getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  },

  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },

  addItem(item) {
    const cart = this.getCart();

    const index = cart.findIndex((i) => i.productSizeId === item.productSizeId);

    if (index >= 0) {
      cart[index].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
  },

  removeItem(productSizeId) {
    const cart = this.getCart().filter(
      (i) => i.productSizeId !== productSizeId
    );
    this.saveCart(cart);
  },

  clear() {
    localStorage.removeItem(CART_KEY);
  },
};

export default cartService;
