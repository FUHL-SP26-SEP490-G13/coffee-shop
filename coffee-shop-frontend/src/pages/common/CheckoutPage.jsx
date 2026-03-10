import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cartService } from "@/services/cartService";
import orderService from "@/services/orderService";
import authenticationService from "@/services/authenticationService";
import { STORAGE_KEYS } from "@/constants";
import { validateOrderForm, validateOrderField } from "@/utils/orderValidation";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useMemo(() => cartService.getCart(), []);
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const [submitting, setSubmitting] = useState(false);
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

  const subtotalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const discountAmount = 0;
  const totalAmount = subtotalAmount - discountAmount;
  //     const formErrors = validateOrderForm(form);

  //     if (Object.keys(formErrors).length > 0) {
  //       setErrors(formErrors);
  //       return;
  //     }

  //     try {
  //       setSubmitting(true);

  //       const payload = {
  //         order_type: form.order_type,
  //         payment_method: form.payment_method,
  //         receiver_name: form.receiver_name.trim(),
  //         receiver_phone: form.receiver_phone.trim(),
  //         receiver_email: form.receiver_email.trim(),
  //         address: form.address.trim(),
  //         note: form.note.trim(),
  //         items: cart.map((item) => ({
  //           product_size_id: item.productSizeId,
  //           quantity: item.quantity,
  //         })),
  //       };

  //       await orderService.checkout(payload);
  //       cartService.clearCart();

  //       alert("Đặt hàng thành công");
  //       navigate("/");
  //     } catch (error) {
  //       alert(error?.message || "Đặt hàng thất bại");
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   };

  const handleSubmit = async () => {
    const formErrors = validateOrderForm(form);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        order_type: form.order_type,
        payment_method: form.payment_method,
        receiver_name: form.receiver_name.trim(),
        receiver_phone: form.receiver_phone.trim(),
        receiver_email: form.receiver_email.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        items: cart.map((item) => ({
          product_size_id: item.productSizeId || item.product_size_id,
          quantity: Number(item.quantity),
        })),
      };

      console.log("Checkout payload:", payload);

      await orderService.checkout(payload);
      cartService.clearCart();

      alert("Đặt hàng thành công");
      navigate("/");
    } catch (error) {
      console.error("Checkout error:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

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
              <label className="text-sm font-medium mb-2 block">
                Phương thức thanh toán
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => {
                  const value = e.target.value;

                  setForm((prev) => ({
                    ...prev,
                    payment_method: value,
                  }));

                  setErrors((prev) => ({
                    ...prev,
                    payment_method: validateOrderField("payment_method", value),
                  }));
                }}
                className="w-full border rounded-md h-10 px-3"
              >
                <option value="cash">Tiền mặt</option>
                <option value="banking">Chuyển khoản</option>
                <option value="momo">MoMo</option>
                <option value="card">Thẻ</option>
              </select>
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
                  key={item.productSizeId}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.size} x {item.quantity}
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {(
                      Number(item.price) * Number(item.quantity)
                    ).toLocaleString("vi-VN")}
                    đ
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

            <Button
              className="w-full mb-3"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Đặt hàng"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/cart")}
            >
              ← Quay lại giỏ hàng
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
