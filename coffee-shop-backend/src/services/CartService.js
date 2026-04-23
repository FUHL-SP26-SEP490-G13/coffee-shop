const db = require("../config/database");
const CartRepository = require("../repositories/CartRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class CartService {
  normalizeToppings(toppings = []) {
    if (!Array.isArray(toppings)) return [];

    return toppings
      .map((item) => ({
        topping_id: Number(item?.topping_id || item?.id || 0),
        name: item?.name || "",
        price: Number(item?.price || 0),
        quantity: Math.max(1, Number(item?.quantity || 1)),
      }))
      .filter((item) => item.topping_id > 0)
      .sort((a, b) => a.topping_id - b.topping_id);
  }

  getToppingsSignature(toppings = []) {
    return this.normalizeToppings(toppings)
      .map((item) => `${item.topping_id}-${item.quantity}`)
      .join("|");
  }

  buildCartKey(item) {
    return [
      Number(item.product_size_id),
      this.getToppingsSignature(item.toppings || []),
    ].join("__");
  }

  getBasePrice(item) {
    return Number(
      item?.basePrice ??
      item?.base_price ??
      item?.price ??
      item?.selectedPrice ??
      item?.unit_price ??
      0
    );
  }

  async ensureCart(connection, userId) {
    const existingCart = await CartRepository.findCartByUserId(
      userId,
      connection
    );
    if (existingCart) return existingCart.id;

    return await CartRepository.createCart(userId, connection);
  }

  async validateItem(connection, item) {
    const productSizeId = Number(
      item?.product_size_id || item?.productSizeId || 0
    );
    const quantity = Math.max(1, Number(item?.quantity || 1));

    if (!productSizeId) {
      throw new ErrorResponse(400, "product_size_id không hợp lệ");
    }

    const productSize = await CartRepository.findProductSizeById(
      productSizeId,
      connection
    );

    if (!productSize) {
      throw new ErrorResponse(400, "Sản phẩm không tồn tại");
    }

    const toppings = [];
    for (const topping of this.normalizeToppings(item?.toppings || [])) {
      const toppingDb = await CartRepository.findToppingById(
        topping.topping_id,
        connection
      );

      if (!toppingDb) {
        throw new ErrorResponse(400, "Topping không tồn tại");
      }

      toppings.push({
        topping_id: toppingDb.id,
        name: toppingDb.name,
        quantity: topping.quantity,
        price: Number(toppingDb.price || topping.price || 0),
      });
    }

    const basePrice =
      this.getBasePrice(item) || Number(productSize.default_price || 0);

    return {
      product_id: productSize.product_id,
      product_size_id: productSize.id,
      productSizeId: productSize.id,
      name: productSize.name,
      image: productSize.image,
      size: productSize.size,
      slug: productSize.slug,
      quantity,
      basePrice,
      base_price: basePrice,
      toppings,
    };
  }

  async replaceCart(userId, payload = {}) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const cartId = await this.ensureCart(connection, userId);
      await CartRepository.deleteCartItems(cartId, connection);

      const incomingCartItems = Array.isArray(payload?.items)
        ? payload.items
        : [];

      for (const rawItem of incomingCartItems) {
        const item = await this.validateItem(connection, rawItem);

        const cartItemId = await CartRepository.insertCartItem(
          {
            cart_id: cartId,
            product_size_id: item.product_size_id,
            quantity: item.quantity,
            base_price: item.base_price,
          },
          connection
        );

        for (const topping of item.toppings) {
          await CartRepository.insertCartItemTopping(
            {
              cart_item_id: cartItemId,
              topping_id: topping.topping_id,
              quantity: topping.quantity,
              price: topping.price,
            },
            connection
          );
        }
      }

      await connection.commit();
      return await this.getCartByUser(userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  mergeCollections(existingItems = [], incomingItems = []) {
    const map = new Map();

    [...existingItems, ...incomingItems].forEach((item) => {
      const normalized = {
        ...item,
        product_size_id: Number(
          item.product_size_id || item.productSizeId || 0
        ),
        quantity: Math.max(1, Number(item.quantity || 1)),
        toppings: this.normalizeToppings(item.toppings || []),
      };

      const key = this.buildCartKey(normalized);

      if (!map.has(key)) {
        map.set(key, normalized);
        return;
      }

      const current = map.get(key);
      map.set(key, {
        ...current,
        quantity: Number(current.quantity || 0) + normalized.quantity,
      });
    });

    return Array.from(map.values());
  }

  async mergeCart(userId, payload = {}) {
    const currentCart = await this.getCartByUser(userId);

    const mergedItems = this.mergeCollections(
      currentCart.cartItems,
      payload.items || []
    );

    return await this.replaceCart(userId, {
      items: mergedItems,
    });
  }

  async getCartByUser(userId) {
    const connection = await db.getConnection();

    try {
      const cartId = await this.ensureCart(connection, userId);
      const rows = await CartRepository.findCartItemsByCartId(
        cartId,
        connection
      );

      const itemIds = rows.map((row) => row.id);
      const toppingRows = await CartRepository.findToppingsByCartItemIds(
        itemIds,
        connection
      );

      const toppingsMap = toppingRows.reduce((map, row) => {
        const current = map.get(row.cart_item_id) || [];
        current.push({
          topping_id: row.topping_id,
          name: row.name,
          quantity: Number(row.quantity || 1),
          price: Number(row.price || 0),
        });
        map.set(row.cart_item_id, current);
        return map;
      }, new Map());

      const normalized = rows.map((row) => {
        const toppings = this.normalizeToppings(toppingsMap.get(row.id) || []);
        const basePrice = Number(row.base_price || 0);
        const toppingsTotal = toppings.reduce(
          (sum, topping) =>
            sum + Number(topping.price || 0) * Number(topping.quantity || 1),
          0
        );

        const unitPrice = basePrice + toppingsTotal;

        return {
          id: row.id,
          cart_id: row.cart_id,
          product_id: row.product_id,
          product_size_id: row.product_size_id,
          productSizeId: row.product_size_id,
          name: row.name,
          image: row.image,
          size: row.size,
          slug: row.slug,
          quantity: Number(row.quantity || 1),
          basePrice,
          base_price: basePrice,
          price: basePrice,
          toppings,
          cartKey: this.buildCartKey({
            product_size_id: row.product_size_id,
            toppings,
          }),
          unitPrice,
        };
      });

      const totalAmount = normalized.reduce(
        (sum, item) =>
          sum + item.unitPrice * Math.max(1, Number(item.quantity || 1)),
        0
      );

      return {
        cartId,
        cartItems: normalized,
        totalAmount,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new CartService();
