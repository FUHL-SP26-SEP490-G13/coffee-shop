import axiosClient from "./axiosClient";
import { STORAGE_KEYS } from "@/constants";

const CART_KEY = "cart_items";
const SAVED_KEY = "saved_for_later_items";

let memoryCartItems = [];
let memorySavedItems = [];

const hasToken = () =>
  !!(
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );

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

const getToppingsSignature = (toppings = []) =>
  normalizeToppings(toppings)
    .map((item) => `${item.topping_id}-${item.quantity}`)
    .join("|");


const getCartItemKey = (item) => {
  const sizeId = getItemSizeId(item);
  const productId = item?.product_id || item?.id || 0;
  const identifier = sizeId > 0 ? sizeId : `p${productId}`;
  const toppingKey = getToppingsSignature(item?.toppings || []);
  return `${identifier}__${toppingKey}`;
};

const getBasePrice = (item) =>
  Number(
    item?.basePrice ??
      item?.base_price ??
      item?.price ??
      item?.selectedPrice ??
      item?.unit_price ??
      0
  );

const getToppingsTotal = (toppings = []) =>
  normalizeToppings(toppings).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

const getUnitPrice = (item) =>
  getBasePrice(item) + getToppingsTotal(item?.toppings || []);

const normalizeItem = (item) => {
  const normalizedId = getItemSizeId(item);
  const toppings = normalizeToppings(item?.toppings || []);
  const normalized = {
    ...item,
    productSizeId: normalizedId,
    product_size_id: normalizedId,
    quantity: Math.max(1, Number(item?.quantity) || 1),
    basePrice: getBasePrice(item),
    base_price: getBasePrice(item),
    price: getBasePrice(item),
    saved_for_later: Number(item?.saved_for_later) === 1 ? 1 : 0,
    toppings,
  };

  return {
    ...normalized,
    cartKey: getCartItemKey(normalized),
    unitPrice: getUnitPrice(normalized),
  };
};

const parseStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const getLocalCart = () => parseStorageArray(CART_KEY).map(normalizeItem);
const getLocalSaved = () => parseStorageArray(SAVED_KEY).map(normalizeItem);

const emitCartUpdated = () => window.dispatchEvent(new Event("cartUpdated"));

const persistCollections = (cart, saved) => {
  if (hasToken()) {
    memoryCartItems = cart;
    memorySavedItems = saved;
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
  emitCartUpdated();
};

let hydratePromise = null;
let syncPromise = Promise.resolve();

async function syncToDatabase() {
  if (!hasToken()) return;

  const payload = {
    items: memoryCartItems.map(normalizeItem),
    saved_items: memorySavedItems.map(normalizeItem),
  };

  syncPromise = syncPromise
    .catch(() => undefined)
    .then(() => axiosClient.put("/cart/sync", payload))
    .catch((error) => {
      console.error("Không thể đồng bộ cart lên database:", error);
      throw error;
    });

  return syncPromise;
}

export const cartService = {
  getCart() {
    if (hasToken()) return memoryCartItems.map(normalizeItem);
    return getLocalCart();
  },

  getSavedItems() {
    if (hasToken()) return memorySavedItems.map(normalizeItem);
    return getLocalSaved();
  },

  saveCart(cart) {
    if (hasToken()) {
      memoryCartItems = cart;
      emitCartUpdated();
      void syncToDatabase();
    } else {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      emitCartUpdated();
    }
  },

  saveSavedItems(items) {
    if (hasToken()) {
      memorySavedItems = items;
      emitCartUpdated();
      void syncToDatabase();
    } else {
      localStorage.setItem(SAVED_KEY, JSON.stringify(items));
      emitCartUpdated();
    }
  },

  setCollections(cart, saved) {
    persistCollections(cart, saved);
    if (hasToken()) void syncToDatabase();
  },

  clearCartMemory() {
    memoryCartItems = [];
    memorySavedItems = [];
    emitCartUpdated();
  },

  async hydrateFromDatabase(force = false) {
    if (!hasToken())
      return { cartItems: this.getCart(), savedItems: this.getSavedItems() };
    if (hydratePromise && !force) return hydratePromise;

    hydratePromise = axiosClient
      .get("/cart")
      .then((response) => {
        const data = response?.data || response || {};
        const cartItems = Array.isArray(data?.cartItems)
          ? data.cartItems.map(normalizeItem)
          : [];
        const savedItems = Array.isArray(data?.savedItems)
          ? data.savedItems.map(normalizeItem)
          : [];
        persistCollections(cartItems, savedItems);
        return { cartItems, savedItems };
      })
      .catch((error) => {
        console.error("Không thể lấy cart từ database:", error);
        throw error;
      })
      .finally(() => {
        hydratePromise = null;
      });

    return hydratePromise;
  },

  async mergeLocalCartToDatabase() {
    if (!hasToken())
      return { cartItems: this.getCart(), savedItems: this.getSavedItems() };

    const localCart = getLocalCart();
    const localSaved = getLocalSaved();

    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(SAVED_KEY);

    if (localCart.length === 0 && localSaved.length === 0) {
      return this.hydrateFromDatabase(true);
    }

    const response = await axiosClient.post("/cart/merge", {
      items: localCart,
      saved_items: localSaved,
    });

    const data = response?.data || response || {};
    const cartItems = Array.isArray(data?.cartItems)
      ? data.cartItems.map(normalizeItem)
      : [];
    const savedItems = Array.isArray(data?.savedItems)
      ? data.savedItems.map(normalizeItem)
      : [];
    persistCollections(cartItems, savedItems);
    return { cartItems, savedItems };
  },

  async syncAfterLogin() {
    if (!hasToken()) {
      return { cartItems: this.getCart(), savedItems: this.getSavedItems() };
    }

    try {
      return await this.mergeLocalCartToDatabase();
    } catch (error) {
      console.error("Sync cart sau login thất bại:", error);
      try {
        return await this.hydrateFromDatabase(true);
      } catch (hydrateError) {
        console.error("Hydrate cart after login failed:", hydrateError);
        return { cartItems: this.getCart(), savedItems: this.getSavedItems() };
      }
    }
  },

  addItem(item) {
    const cart = this.getCart();
    const normalizedItem = normalizeItem(item);
    const newCartKey = getCartItemKey(normalizedItem);
    const index = cart.findIndex((x) => getCartItemKey(x) === newCartKey);

    if (index >= 0) {
      cart[index].quantity =
        Number(cart[index].quantity || 0) + normalizedItem.quantity;
      cart[index] = {
        ...cart[index],
        name: normalizedItem.name || cart[index].name,
        image: normalizedItem.image || cart[index].image,
        size: normalizedItem.size || cart[index].size,
        basePrice: getBasePrice(normalizedItem),
        base_price: getBasePrice(normalizedItem),
        price: getBasePrice(normalizedItem),
      };
    } else {
      cart.push(normalizedItem);
    }

    this.saveCart(cart);
    window.dispatchEvent(new Event("cartAdded"));
  },

  updateQuantity(cartKey, quantity) {
    const cart = this.getCart().map((item) => {
      if (item.cartKey === cartKey || getCartItemKey(item) === cartKey) {
        return { ...item, quantity: Math.max(1, Number(quantity) || 1) };
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
    const updatedItem = {
      ...currentItem,
      toppings: normalizeToppings(toppings),
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
      cart[currentIndex] = normalizeItem(updatedItem);
    }

    this.saveCart(cart);
  },

  updateItemSize(cartKey, newSizeId, newSizeName, newBasePrice) {
    const cart = this.getCart();
    const currentIndex = cart.findIndex(
      (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
    );

    if (currentIndex === -1) return;

    const currentItem = cart[currentIndex];
    const updatedItem = {
      ...currentItem,
      productSizeId: newSizeId,
      product_size_id: newSizeId,
      size: newSizeName,
      basePrice: newBasePrice,
      base_price: newBasePrice,
      price: newBasePrice,
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
      cart[currentIndex] = normalizeItem(updatedItem);
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
    const nextToppings = normalizeToppings(currentItem.toppings || []).map(
      (topping) =>
        Number(topping.topping_id) === Number(toppingId)
          ? { ...topping, quantity: Math.max(1, Number(quantity) || 1) }
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

  moveToSaved(cartKey) {
    const cart = this.getCart();
    const idx = cart.findIndex(
      (i) => i.cartKey === cartKey || getCartItemKey(i) === cartKey
    );
    if (idx >= 0) {
      const item = cart[idx];
      const saved = this.getSavedItems();
      const existsIdx = saved.findIndex((s) => s.cartKey === item.cartKey);
      if (existsIdx === -1) {
        saved.push({ ...item, quantity: 1 });
      }
      persistCollections(
        cart.filter((_, index) => index !== idx),
        saved
      );
      void syncToDatabase();
    }
  },

  moveToCart(cartKey) {
    const saved = this.getSavedItems();
    const idx = saved.findIndex(
      (i) => i.cartKey === cartKey || getCartItemKey(i) === cartKey
    );
    if (idx >= 0) {
      const item = saved[idx];
      const cart = this.getCart();
      const newCartKey = getCartItemKey(item);
      const existingIndex = cart.findIndex(
        (x) => getCartItemKey(x) === newCartKey
      );
      if (existingIndex >= 0) {
        cart[existingIndex].quantity =
          Number(cart[existingIndex].quantity || 0) +
          Number(item.quantity || 1);
      } else {
        cart.push(item);
      }
      persistCollections(
        cart,
        saved.filter((_, index) => index !== idx)
      );
      void syncToDatabase();
    }
  },

  removeSavedItem(cartKey) {
    const saved = this.getSavedItems().filter(
      (item) => item.cartKey !== cartKey && getCartItemKey(item) !== cartKey
    );
    this.saveSavedItems(saved);
  },
};
