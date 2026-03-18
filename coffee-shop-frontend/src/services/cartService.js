const CART_KEY = "cart_items";

const getItemSizeId = (item) =>
  Number(item?.productSizeId || item?.product_size_id || 0);

const normalizeToppings = (toppings = []) => {
  if (!Array.isArray(toppings)) return [];

  return toppings
    .map((item) => ({
      topping_id: Number(item?.topping_id || item?.id || 0),
      name: item?.name || "",
      price: Number(item?.price) || 0,
      quantity: Math.max(1, Number(item?.quantity) || 1),
    }))
    .filter((item) => item.topping_id > 0)
    .sort((a, b) => a.topping_id - b.topping_id);
};

const getToppingsSignature = (toppings = []) => {
  return normalizeToppings(toppings)
    .map((item) => `${item.topping_id}-${item.quantity}`)
    .join("|");
};

const getCartItemKey = (item) => {
  const sizeId = getItemSizeId(item);
  const toppingKey = getToppingsSignature(item?.toppings || []);
  return `${sizeId}__${toppingKey}`;
};

const getBasePrice = (item) =>
  Number(
    item?.basePrice ||
      item?.price ||
      item?.selectedPrice ||
      item?.unit_price ||
      0
  );

const getToppingsTotal = (toppings = []) => {
  return normalizeToppings(toppings).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
};

const getUnitPrice = (item) => {
  return getBasePrice(item) + getToppingsTotal(item?.toppings || []);
};

export const cartService = {
  getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(cart)) return [];

      return cart.map((item) => {
        const normalizedId = getItemSizeId(item);
        const toppings = normalizeToppings(item?.toppings || []);

        return {
          ...item,
          productSizeId: normalizedId,
          product_size_id: normalizedId,
          quantity: Math.max(1, Number(item.quantity) || 1),
          basePrice: getBasePrice(item),
          price: getBasePrice(item),
          toppings,
          cartKey: `${normalizedId}__${getToppingsSignature(toppings)}`,
          unitPrice: getUnitPrice({
            ...item,
            toppings,
          }),
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
    const toppings = normalizeToppings(item?.toppings || []);

    const normalizedItem = {
      ...item,
      productSizeId: normalizedId,
      product_size_id: normalizedId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      basePrice: getBasePrice(item),
      price: getBasePrice(item),
      toppings,
    };

    const newCartKey = getCartItemKey(normalizedItem);
    const index = cart.findIndex((x) => getCartItemKey(x) === newCartKey);

    if (index >= 0) {
      cart[index].quantity =
        Number(cart[index].quantity || 0) + normalizedItem.quantity;
      cart[index] = {
        ...cart[index],
        name: normalizedItem.name || cart[index].name,
        image: normalizedItem.image || cart[index].image,
        basePrice: getBasePrice(normalizedItem),
        price: getBasePrice(normalizedItem),
      };
    } else {
      cart.push(normalizedItem);
    }

    this.saveCart(cart);
  },

  updateQuantity(cartKey, quantity) {
    const cart = this.getCart().map((item) => {
      if (item.cartKey === cartKey || getCartItemKey(item) === cartKey) {
        return {
          ...item,
          quantity: Math.max(1, Number(quantity) || 1),
        };
      }
      return item;
    });

    this.saveCart(cart);
  },

  updateToppings(cartKey, toppings) {
    const cart = this.getCart();
    const currentIndex = cart.findIndex(
      (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
    );

    if (currentIndex === -1) return;

    const currentItem = cart[currentIndex];
    const normalizedToppings = normalizeToppings(toppings);

    const updatedItem = {
      ...currentItem,
      toppings: normalizedToppings,
    };

    const newCartKey = getCartItemKey(updatedItem);

    const duplicateIndex = cart.findIndex(
      (item, index) =>
        index !== currentIndex && getCartItemKey(item) === newCartKey
    );

    if (duplicateIndex >= 0) {
      cart[duplicateIndex] = {
        ...cart[duplicateIndex],
        quantity:
          Math.max(1, Number(cart[duplicateIndex].quantity) || 1) +
          Math.max(1, Number(updatedItem.quantity) || 1),
      };

      cart.splice(currentIndex, 1);
    } else {
      cart[currentIndex] = {
        ...updatedItem,
        cartKey: newCartKey,
        unitPrice: getUnitPrice(updatedItem),
      };
    }

    this.saveCart(cart);
  },

  updateToppingQuantity(cartKey, toppingId, quantity) {
    const cart = this.getCart();
    const currentIndex = cart.findIndex(
      (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
    );

    if (currentIndex === -1) return;

    const currentItem = cart[currentIndex];
    const currentToppings = normalizeToppings(currentItem.toppings || []);

    const nextToppings = currentToppings.map((topping) =>
      Number(topping.topping_id) === Number(toppingId)
        ? {
            ...topping,
            quantity: Math.max(1, Number(quantity) || 1),
          }
        : topping
    );

    this.updateToppings(cartKey, nextToppings);
  },

  removeTopping(cartKey, toppingId) {
    const cart = this.getCart();
    const currentItem = cart.find(
      (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
    );

    if (!currentItem) return;

    const nextToppings = normalizeToppings(currentItem.toppings || []).filter(
      (topping) => Number(topping.topping_id) !== Number(toppingId)
    );

    this.updateToppings(cartKey, nextToppings);
  },

  removeItem(cartKey) {
    const cart = this.getCart().filter(
      (item) => item.cartKey !== cartKey && getCartItemKey(item) !== cartKey
    );

    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getItemUnitPrice(item) {
    return getUnitPrice(item);
  },

  getItemSubtotal(item) {
    return getUnitPrice(item) * Math.max(1, Number(item?.quantity) || 1);
  },

  getTotalAmount() {
    return this.getCart().reduce(
      (sum, item) => sum + this.getItemSubtotal(item),
      0
    );
  },
};
