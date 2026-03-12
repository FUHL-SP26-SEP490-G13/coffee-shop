import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cartService } from "@/services/cartService";
import authenticationService from "@/services/authenticationService";
import PlaceOrderButton from "@/components/order/PlaceOrderButton";
import { STORAGE_KEYS } from "@/constants";
import { validateOrderField } from "@/utils/orderValidation";
import PayOSLogo from "/logo/payOS.svg";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useMemo(() => cartService.getCart(), []);
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const [discountCode, setDiscountCode] = useState("");
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    order_type: "delivery",
    payment_method: "cash",
    receiver_name: "",
    receiver_phone: "",
    receiver_email: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;

      try {
        const res = await authenticationService.getProfile();
        const user = res?.data;

        setForm((prev) => ({
          ...prev,
          receiver_name: `${user?.first_name || ""} ${
            user?.last_name || ""
          }`.trim(),
          receiver_phone: user?.phone || "",
          receiver_email: user?.email || "",
          address: user?.address || "",
        }));
      } catch (error) {
        console.error("Không lấy được thông tin profile:", error);
      }
    };

    loadProfile();
  }, [token]);

  const subtotalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + cartService.getItemSubtotal(item),
      0
    );
  }, [cart]);

  const discountAmount = 0;
  const totalAmount = subtotalAmount - discountAmount;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border rounded-2xl p-6 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Thanh toán
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Họ tên người nhận
                </label>
                <Input
                  value={form.receiver_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      receiver_name: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      receiver_name: validateOrderField("receiver_name", value),
                    }));
                  }}
                />
                {errors.receiver_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.receiver_name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Số điện thoại
                </label>
                <Input
                  value={form.receiver_phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      receiver_phone: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      receiver_phone: validateOrderField(
                        "receiver_phone",
                        value
                      ),
                    }));
                  }}
                />
                {errors.receiver_phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.receiver_phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  value={form.receiver_email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      receiver_email: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      receiver_email: validateOrderField(
                        "receiver_email",
                        value
                      ),
                    }));
                  }}
                />
                {errors.receiver_email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.receiver_email}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Hình thức nhận hàng
                </label>
                <select
                  value={form.order_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      order_type: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md h-10 px-3"
                >
                  <option value="delivery">Giao hàng</option>
                  <option value="takeaway">Mang đi</option>
                </select>
              </div>
            </div>

            {form.order_type === "delivery" && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">
                  Địa chỉ giao hàng
                </label>
                <Input
                  value={form.address}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      address: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      address: validateOrderField("address", value),
                    }));
                  }}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium mb-3 block">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: "cash",
                    label: "Tiền mặt",
                    sub: "Thanh toán khi nhận hàng",
                    icon: <Banknote className="w-5 h-5 text-green-600" />,
                  },
                  {
                    value: "payos",
                    label: "PayOS",
                    sub: "Thanh toán trực tuyến qua PayOS",
                    icon: <img src={PayOSLogo} alt="PayOS" className="w-20 object-contain" />,
                  },
                ].map((opt) => {
                  const selected = form.payment_method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          payment_method: opt.value,
                        }))
                      }
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selected
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          selected ? "bg-amber-100" : "bg-gray-100"
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          {opt.label}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {opt.sub}
                        </span>
                      </span>
                      <span
                        className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${
                          selected
                            ? "border-amber-500 bg-amber-500"
                            : "border-gray-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ghi chú</label>
              <Textarea
                value={form.note}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    note: value,
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    note: validateOrderField("note", value),
                  }));
                }}
              />
              {errors.note && (
                <p className="text-sm text-red-500 mt-1">{errors.note}</p>
              )}
            </div>
          </div>

          <div className="border rounded-2xl p-5 bg-gray-50 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng</h2>

            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.size} x {item.quantity}
                    </p>

                    {Array.isArray(item.toppings) &&
                      item.toppings.length > 0 && (
                        <div className="mt-1">
                          {item.toppings.map((topping) => (
                            <p
                              key={topping.topping_id}
                              className="text-xs text-gray-500"
                            >
                              + {topping.name} x {topping.quantity}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>

                  <p className="text-sm font-semibold">
                    {cartService.getItemSubtotal(item).toLocaleString("vi-VN")}đ
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-sm font-medium mb-2 block">
                Nhập mã giảm giá
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => alert("Chức năng đang phát triển")}
                >
                  Áp dụng
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4 mb-4">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Tạm tính</span>
                <span>{subtotalAmount.toLocaleString("vi-VN")}đ</span>
              </div>

              <div className="flex justify-between text-sm text-gray-700">
                <span>Giảm giá</span>
                <span>- {discountAmount.toLocaleString("vi-VN")}đ</span>
              </div>

              <div className="flex justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-amber-600">
                  {totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <PlaceOrderButton
              form={form}
              cart={cart}
              totalAmount={totalAmount}
              onValidateError={(errs) => setErrors(errs)}
              onSuccess={() => navigate("/")}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
