import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cartService } from "@/services/cartService";

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  const refreshCart = () => {
    setCart(cartService.getCart());
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/products")}>
              ← Tiếp tục mua hàng
            </Button>

            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border">
              <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống</p>
              <Button onClick={() => navigate("/products")}>
                Tiếp tục mua hàng
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => {
                  const itemId = Number(
                    item.productSizeId || item.product_size_id
                  );

                  return (
                    <div
                      key={itemId}
                      className="flex gap-4 p-4 border rounded-2xl bg-white"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-xl object-cover border"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Size: {item.size}
                        </p>

                        <p className="text-amber-600 font-bold mt-2">
                          {Number(item.price).toLocaleString("vi-VN")}đ
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = Math.max(
                                1,
                                Number(item.quantity) - 1
                              );
                              cartService.updateQuantity(itemId, nextQty);
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
                              cartService.updateQuantity(itemId, nextQty);
                              refreshCart();
                            }}
                            className="w-16 h-10 border rounded-lg text-center"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = Number(item.quantity) + 1;
                              cartService.updateQuantity(itemId, nextQty);
                              refreshCart();
                            }}
                            className="w-10 h-10 border rounded-lg hover:bg-gray-50 text-lg"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              cartService.removeItem(itemId);
                              refreshCart();
                            }}
                            className="ml-4 text-red-600 text-sm hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="font-bold text-gray-900 whitespace-nowrap">
                        {(
                          Number(item.price) * Number(item.quantity)
                        ).toLocaleString("vi-VN")}
                        đ
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border rounded-2xl p-5 h-fit bg-gray-50">
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
