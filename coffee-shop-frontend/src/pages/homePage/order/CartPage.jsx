import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cartService } from "@/services/cartService";
import toppingService from "@/services/toppingService";

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => cartService.getCart());
  const [allToppings, setAllToppings] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const refreshCart = () => {
    setCart(cartService.getCart());
  };

  useEffect(() => {
    window.addEventListener("cartUpdated", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("cartUpdated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const res = await toppingService.getAll();
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setAllToppings(list);
      } catch (error) {
        console.error("Lỗi lấy topping:", error);
        setAllToppings([]);
      }
    };

    fetchToppings();
  }, []);

  const totalAmount = cartService.getTotalAmount();

  const isToppingSelected = (item, toppingId) => {
    return Array.isArray(item.toppings)
      ? item.toppings.some((t) => Number(t.topping_id) === Number(toppingId))
      : false;
  };

  const getSelectedTopping = (item, toppingId) => {
    return Array.isArray(item.toppings)
      ? item.toppings.find((t) => Number(t.topping_id) === Number(toppingId)) ||
          null
      : null;
  };

  const toggleToppingForItem = (item, topping) => {
    const cartKey = item.cartKey;
    const currentToppings = Array.isArray(item.toppings) ? item.toppings : [];

    const exists = currentToppings.some(
      (t) => Number(t.topping_id) === Number(topping.id)
    );

    let nextToppings = [];

    if (exists) {
      nextToppings = currentToppings.filter(
        (t) => Number(t.topping_id) !== Number(topping.id)
      );
    } else {
      nextToppings = [
        ...currentToppings,
        {
          topping_id: Number(topping.id),
          name: topping.name,
          price: Number(topping.price) || 0,
          quantity: 1,
        },
      ];
    }

    cartService.updateToppings(cartKey, nextToppings);
    refreshCart();
  };

  const updateToppingQuantityForItem = (item, toppingId, nextQuantity) => {
    cartService.updateToppingQuantity(
      item.cartKey,
      toppingId,
      Math.max(1, Number(nextQuantity) || 1)
    );
    refreshCart();
  };

  const removeToppingForItem = (item, toppingId) => {
    cartService.removeTopping(item.cartKey, toppingId);
    refreshCart();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>

            <Button variant="outline" onClick={() => navigate("/products")}>
              Tiếp tục mua hàng
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-gray-50">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống</p>
              <Button onClick={() => navigate("/products")}>
                Tiếp tục mua hàng
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item, index) => {
                  const cartKey = item.cartKey;
                  const unitPrice = cartService.getItemUnitPrice(item);
                  const itemTotal = cartService.getItemSubtotal(item);
                  const isEditing = editingIndex === index;

                  return (
                    <div
                      key={cartKey}
                      className="border border-gray-200 rounded-2xl p-5 bg-white"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          onClick={() => navigate(`/products/${item.product_id || item.id}`)}
                          className="w-24 h-24 text-gray-900 rounded-xl object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <h3
                                className="text-lg font-semibold cursor-pointer hover:text-amber-600 transition-colors"
                                onClick={() => navigate(`/products/${item.product_id || item.id}`)}
                              >
                                {item.name}
                              </h3>

                              <p className="text-sm text-gray-500 mt-1">
                                Size: {item.size}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                Giá gốc:{" "}
                                {Number(
                                  item.basePrice || item.price
                                ).toLocaleString("vi-VN")}
                                đ
                              </p>
                            </div>

                            <div className="font-bold text-gray-900 whitespace-nowrap">
                              {itemTotal.toLocaleString("vi-VN")}đ
                            </div>
                          </div>

                          {Array.isArray(item.toppings) &&
                            item.toppings.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700">
                                  Topping:
                                </p>

                                <div className="space-y-1 mt-1">
                                  {item.toppings.map((topping) => (
                                    <div
                                      key={topping.topping_id}
                                      className="flex items-center justify-between gap-3 text-sm text-gray-500"
                                    >
                                      <span className="break-words">
                                        - {topping.name} x {topping.quantity} (
                                        {Number(topping.price).toLocaleString(
                                          "vi-VN"
                                        )}
                                        đ)
                                      </span>

                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeToppingForItem(
                                              item,
                                              topping.topping_id
                                            )
                                          }
                                          className="text-red-600 hover:underline shrink-0"
                                        >
                                          Xóa topping
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <p className="text-amber-600 font-bold mt-3">
                            Đơn giá: {unitPrice.toLocaleString("vi-VN")}đ
                          </p>

                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const nextQty = Math.max(
                                  1,
                                  Number(item.quantity) - 1
                                );
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-10 h-10 border rounded-lg hover:bg-gray-50 text-lg"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const nextQty = Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                );
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-16 h-10 border rounded-lg text-center"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const nextQty = Number(item.quantity) + 1;
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-10 h-10 border rounded-lg hover:bg-gray-50 text-lg"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingIndex(isEditing ? null : index)
                              }
                              className="text-amber-600 text-sm font-medium hover:underline"
                            >
                              {isEditing ? "Đóng thêm topping" : "Thêm topping"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                cartService.removeItem(cartKey);
                                if (editingIndex === index) {
                                  setEditingIndex(null);
                                }
                                refreshCart();
                              }}
                              className="text-red-600 text-sm font-medium hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-800 mb-3">
                            Chọn topping
                          </p>

                          <div className="max-h-[280px] overflow-y-auto pr-2 space-y-3">
                            {allToppings.map((topping) => {
                              const checked = isToppingSelected(
                                item,
                                topping.id
                              );
                              const selectedTopping = getSelectedTopping(
                                item,
                                topping.id
                              );

                              return (
                                <div
                                  key={topping.id}
                                  className="border border-gray-200 rounded-2xl p-4"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleToppingForItem(item, topping)
                                        }
                                        className="w-4 h-4 shrink-0"
                                      />

                                      <div className="min-w-0">
                                        <p className="font-medium text-gray-900 break-words">
                                          {topping.name}
                                        </p>
                                        <p className="text-sm text-amber-600 font-semibold">
                                          +
                                          {Number(topping.price).toLocaleString(
                                            "vi-VN"
                                          )}
                                          đ
                                        </p>
                                      </div>
                                    </label>

                                    {checked && (
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateToppingQuantityForItem(
                                              item,
                                              topping.id,
                                              Number(
                                                selectedTopping?.quantity || 1
                                              ) - 1
                                            )
                                          }
                                          className="w-8 h-8 border rounded-lg hover:bg-gray-50"
                                        >
                                          -
                                        </button>

                                        <span className="min-w-[24px] text-center font-medium">
                                          {selectedTopping?.quantity || 1}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateToppingQuantityForItem(
                                              item,
                                              topping.id,
                                              Number(
                                                selectedTopping?.quantity || 1
                                              ) + 1
                                            )
                                          }
                                          className="w-8 h-8 border rounded-lg hover:bg-gray-50"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border rounded-2xl p-5 h-fit bg-gray-50 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Tóm tắt đơn hàng
                </h2>

                <div className="flex justify-between text-gray-700 mb-3">
                  <span>Tổng tiền</span>
                  <span className="font-bold text-amber-600">
                    {totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => navigate("/checkout")}
                >
                  Tiến hành thanh toán
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
