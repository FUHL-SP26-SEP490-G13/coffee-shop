import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosClient from '../services/axiosClient';
import { STORAGE_KEYS } from '@/constants';

const CART_KEY = "cart_items";

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
    toppings,
  };

  return {
    ...normalized,
    cartKey: getCartItemKey(normalized),
    unitPrice: getUnitPrice(normalized),
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      // Sync local cart to DB if logged in
      syncCart: async (cartData) => {
        if (!hasToken()) return;
        const currentCart = cartData || get().cart;
        try {
          await axiosClient.put("/cart/sync", {
            items: currentCart.map(normalizeItem),
          });
        } catch (error) {
          console.error("Lỗi đồng bộ giỏ hàng:", error);
        }
      },

      hydrateFromDatabase: async (force = false) => {
        if (!hasToken()) return;
        try {
          const res = await axiosClient.get("/cart");
          const data = res?.data || res || {};
          const cartItems = Array.isArray(data?.cartItems)
            ? data.cartItems.map(normalizeItem)
            : [];
          set({ cart: cartItems });
        } catch (error) {
          console.error("Không thể lấy cart từ db:", error);
        }
      },

      mergeLocalCartToDatabase: async () => {
        if (!hasToken()) return;
        const { cart } = get();
        if (cart.length === 0) {
          await get().hydrateFromDatabase(true);
          return;
        }
        try {
          const res = await axiosClient.post("/cart/merge", { items: cart });
          const data = res?.data || res || {};
          const cartItems = Array.isArray(data?.cartItems)
            ? data.cartItems.map(normalizeItem)
            : [];
          set({ cart: cartItems });
        } catch (e) {
          console.error("Lỗi gộp giỏ hàng:", e);
        }
      },

      syncAfterLogin: async () => {
        if (!hasToken()) return;
        try {
          await get().mergeLocalCartToDatabase();
        } catch (error) {
          console.error("Sync cart sau login thất bại:", error);
          await get().hydrateFromDatabase(true);
        }
      },

      addItem: (item) => {
        const normalizedItem = normalizeItem(item);
        const newCartKey = getCartItemKey(normalizedItem);
        let newCart = [...get().cart];

        const index = newCart.findIndex((x) => getCartItemKey(x) === newCartKey);
        if (index >= 0) {
          newCart[index] = {
            ...newCart[index],
            ...normalizedItem,
            quantity: Number(newCart[index].quantity || 0) + normalizedItem.quantity,
          };
        } else {
          newCart.push(normalizedItem);
        }

        set({ cart: newCart });
        get().syncCart(newCart);
      },

      updateQuantity: (cartKey, quantity) => {
        const newCart = get().cart.map((item) => {
          if (item.cartKey === cartKey || getCartItemKey(item) === cartKey) {
            return { ...item, quantity: Math.max(1, Number(quantity) || 1) };
          }
          return item;
        });
        set({ cart: newCart });
        get().syncCart(newCart);
      },

      updateToppings: (cartKey, toppings) => {
        const cart = [...get().cart];
        const currentIndex = cart.findIndex(
          (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
        );
        if (currentIndex === -1) return;

        const updatedItem = {
          ...cart[currentIndex],
          toppings: normalizeToppings(toppings),
        };
        const newCartKey = getCartItemKey(updatedItem);
        const duplicateIndex = cart.findIndex(
          (item, index) => index !== currentIndex && getCartItemKey(item) === newCartKey
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
        set({ cart });
        get().syncCart(cart);
      },

      updateItemSize: (cartKey, newSizeId, newSizeName, newBasePrice) => {
        const cart = [...get().cart];
        const currentIndex = cart.findIndex(
          (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
        );
        if (currentIndex === -1) return;

        const updatedItem = {
          ...cart[currentIndex],
          productSizeId: newSizeId,
          product_size_id: newSizeId,
          size: newSizeName,
          basePrice: newBasePrice,
          base_price: newBasePrice,
          price: newBasePrice,
        };

        const newCartKey = getCartItemKey(updatedItem);
        const duplicateIndex = cart.findIndex(
          (item, index) => index !== currentIndex && getCartItemKey(item) === newCartKey
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
        set({ cart });
        get().syncCart(cart);
      },

      removeTopping: (cartKey, toppingId) => {
        const currentItem = get().cart.find(
          (item) => item.cartKey === cartKey || getCartItemKey(item) === cartKey
        );
        if (!currentItem) return;

        const nextToppings = normalizeToppings(currentItem.toppings || []).filter(
          (topping) => Number(topping.topping_id) !== Number(toppingId)
        );
        get().updateToppings(cartKey, nextToppings);
      },

      removeItem: (cartKey) => {
        const newCart = get().cart.filter(
          (item) => item.cartKey !== cartKey && getCartItemKey(item) !== cartKey
        );
        set({ cart: newCart });
        get().syncCart(newCart);
      },

      clearCart: () => {
        set({ cart: [] });
        get().syncCart([]);
      },

      clearCartMemory: () => {
        set({ cart: [] });
      },

      getItemUnitPrice: (item) => getUnitPrice(item),
      getItemSubtotal: (item) =>
        getUnitPrice(item) * Math.max(1, Number(item?.quantity) || 1),
      getTotalAmount: () =>
        get().cart.reduce((sum, item) => sum + get().getItemSubtotal(item), 0),
    }),
    {
      name: CART_KEY, // The key to use in localStorage
    }
  )
);
