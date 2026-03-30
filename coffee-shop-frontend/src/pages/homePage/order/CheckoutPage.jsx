import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, CircleHelp, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cartService } from "@/services/cartService";
import authenticationService from "@/services/authenticationService";
import PlaceOrderButton from "@/components/order/PlaceOrderButton";
import ReputationScoreDialog from "@/components/order/ReputationScoreDialog";
import orderService from "@/services/orderOnlineService";
import { STORAGE_KEYS } from "@/constants";
import { validateOrderField } from "@/utils/orderValidation";
import PayOSLogo from "/logo/payOS.svg";
import reputationService from "@/services/reputationService";
import {
  getReputationColor,
  getReputationTierLabel,
  validateOrderPermissions,
} from "@/utils/reputationValidation";
import { toast } from "sonner";
import flashSaleService from "@/services/flashSaleService";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useMemo(() => cartService.getCart(), []);
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [errors, setErrors] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isReputationDialogOpen, setIsReputationDialogOpen] = useState(false);
  const [reputationScore, setReputationScore] = useState(50);
  const [reputationTier, setReputationTier] = useState("SILVER");
  const [reputationFrozen, setReputationFrozen] = useState(false);
  const [isReputationLoading, setIsReputationLoading] = useState(false);
  const [paymentValidation, setPaymentValidation] = useState(null);
  const [form, setForm] = useState({
    order_type: "delivery",
    payment_method: "payos",
    receiver_name: "",
    receiver_phone: "",
    receiver_email: "",
    address: "",
    note: "",
    discount_code: "",
  });
  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService
      .getCurrentActive()
      .then((res) => {
        setActiveSale(res?.data || null);
      })
      .catch((err) => console.error("Error fetching active sale:", err));
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  useEffect(() => {
    const loadCheckoutData = async () => {
      if (!token) return;

      try {
        const [profileRes, addressesRes] = await Promise.all([
          authenticationService.getProfile(),
          authenticationService.getMyAddresses(),
        ]);

        const user = profileRes?.data;

        const addressList = Array.isArray(addressesRes?.data)
          ? addressesRes.data
          : [];
        const defaultAddress =
          addressList.find((item) => Number(item.is_default) === 1) ||
          addressList[0] ||
          null;

        setAddresses(addressList);
        setSelectedAddressId(defaultAddress?.id || null);

        setForm((prev) => ({
          ...prev,
          receiver_name:
            defaultAddress?.receiver_name ||
            `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
          receiver_phone: defaultAddress?.receiver_phone || user?.phone || "",
          receiver_email: user?.email || "",
          address: defaultAddress?.address || user?.address || "",
        }));
      } catch (error) {
        console.error("Không lấy được thông tin profile:", error);
      } finally {
        setIsAddressLoading(false);
      }
    };

    setIsAddressLoading(true);
    loadCheckoutData();
  }, [token]);

  const normalizePhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("84") && digits.length >= 11) {
      return `0${digits.slice(2)}`;
    }
    if (digits.length === 9) return `0${digits}`;
    return digits;
  };

  useEffect(() => {
    const normalizedPhone = normalizePhoneNumber(form.receiver_phone);

    if (normalizedPhone.length < 10) {
      setReputationScore(50);
      setReputationTier("SILVER");
      setReputationFrozen(false);
      setIsReputationLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsReputationLoading(true);
      try {
        const res =
          await reputationService.getReputationProfile(normalizedPhone);
        const reputation = res?.data?.data || res?.data || {};

        setReputationScore(Number(reputation?.current_score ?? 50));
        setReputationTier(String(reputation?.reputation_tier || "SILVER"));
        setReputationFrozen(
          Number(reputation?.is_frozen || 0) === 1 ||
            reputation?.is_frozen === true,
        );
      } catch (error) {
        console.error("Lỗi lấy điểm uy tín theo số điện thoại:", error);
        setReputationScore(50);
        setReputationTier("SILVER");
        setReputationFrozen(false);
      } finally {
        setIsReputationLoading(false);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [form.receiver_phone]);

  const getAddressTypeLabel = (type) => {
    if (type === "work") return "Văn phòng";
    if (type === "other") return "Khác";
    return "Nhà riêng";
  };

  const handleSelectAddress = (item) => {
    setSelectedAddressId(item.id);
    setForm((prev) => ({
      ...prev,
      receiver_name: item.receiver_name || prev.receiver_name,
      receiver_phone: item.receiver_phone || prev.receiver_phone,
      address: item.address || "",
    }));
    setErrors((prev) => ({
      ...prev,
      receiver_name: validateOrderField(
        "receiver_name",
        item.receiver_name || form.receiver_name,
      ),
      receiver_phone: validateOrderField(
        "receiver_phone",
        item.receiver_phone || form.receiver_phone,
      ),
      address: validateOrderField("address", item.address || ""),
    }));
    setIsAddressDialogOpen(false);
  };

  const selectedAddress =
    addresses.find((item) => item.id === selectedAddressId) || null;

  const normalizedReputationTier = useMemo(() => {
    const tier = String(reputationTier || "").toUpperCase();
    if (["BRONZE", "SILVER", "GOLD", "DIAMOND"].includes(tier)) {
      return tier;
    }
    return getReputationTierLabel(reputationScore);
  }, [reputationTier, reputationScore]);

  const reputationTierText = useMemo(() => {
    const map = {
      BRONZE: "Đồng",
      SILVER: "Bạc",
      GOLD: "Vàng",
      DIAMOND: "Kim cương",
    };
    return map[normalizedReputationTier] || normalizedReputationTier;
  }, [normalizedReputationTier]);

  const subtotalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + cartService.getItemSubtotal(item),
      0,
    );
  }, [cart]);

  const regularAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const isFlashSale = activeSale?.product_ids?.some(
        (id) => Number(id) === Number(item.product_id || item.id),
      );
      if (isFlashSale) {
        return sum; // Do not include in regular amount
      }
      return sum + cartService.getItemSubtotal(item);
    }, 0);
  }, [cart, activeSale]);

  const discountAmount = Number(appliedDiscount?.discount_amount || 0);
  const totalAmount = subtotalAmount - discountAmount;

  // Validate payment permissions khi điểm uy tín thay đổi
  useEffect(() => {
    try {
      const validation = validateOrderPermissions(
        reputationScore,
        totalAmount,
        reputationFrozen,
      );
      setPaymentValidation(validation);

      // Force PayOS nếu bắt buộc
      if (validation.forcePayOS && form.payment_method === "cash") {
        setForm((prev) => ({
          ...prev,
          payment_method: "payos",
        }));
        toast.warning(`Chuyển sang PayOS: ${validation.message}`, {
          duration: 5000,
        });
      }
    } catch (error) {
      // Account blocked
      toast.error(error.message, { duration: 5000 });
      setPaymentValidation(null);
    }
  }, [reputationScore, reputationFrozen, totalAmount, form.payment_method]);

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();

    if (!code) {
      alert("Vui lòng nhập mã giảm giá");
      return;
    }

    if (regularAmount === 0) {
      alert(
        "Mã giảm giá không áp dụng cho đơn hàng chỉ có sản phẩm Flash Sale!",
      );
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const itemsPayload = cart.map((item) => ({
        product_size_id: item.productSizeId || item.product_size_id,
        quantity: item.quantity,
        toppings:
          item.toppings?.map((t) => ({
            topping_id: t.topping_id,
            quantity: t.quantity,
          })) || [],
      }));

      const res = await orderService.validateDiscount({
        code,
        items: itemsPayload,
      });

      const discountData = res?.data;
      setAppliedDiscount(discountData || null);

      setForm((prev) => ({
        ...prev,
        discount_code: discountData?.code || code,
      }));

      alert("Áp dụng mã giảm giá thành công");
    } catch (error) {
      setAppliedDiscount(null);
      setForm((prev) => ({
        ...prev,
        discount_code: "",
      }));

      alert(error?.response?.data?.message || "Mã giảm giá không hợp lệ");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border rounded-2xl p-6 bg-white dark:bg-gray-900">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
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
                        value,
                      ),
                    }));
                  }}
                />
                {errors.receiver_phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.receiver_phone}
                  </p>
                )}
                {!errors.receiver_phone && form.receiver_phone ? (
                  <p
                    className={`mt-1 text-xs ${
                      reputationFrozen ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {reputationFrozen
                      ? "Số điện thoại này đã bị khóa"
                      : "Số điện thoại hợp lệ"}
                  </p>
                ) : null}
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
                        value,
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
              <div className="mb-4 space-y-4">
                {token && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <label className="text-sm font-medium block">
                        Địa chỉ đã lưu
                      </label>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddressDialogOpen(true)}
                      disabled={isAddressLoading || addresses.length === 0}
                    >
                      {isAddressLoading
                        ? "Đang tải địa chỉ..."
                        : addresses.length === 0
                          ? "Chưa có địa chỉ đã lưu"
                          : "Chọn địa chỉ giao hàng"}
                    </Button>

                    {addresses.length === 0 && !isAddressLoading && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Bạn chưa lưu địa chỉ nào. Hãy nhập địa chỉ giao hàng bên
                        dưới.
                      </p>
                    )}

                    {selectedAddress && (
                      <div className="mt-3 border rounded-xl p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {selectedAddress.receiver_name ||
                              "Địa chỉ giao hàng"}
                          </p>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {getAddressTypeLabel(selectedAddress.address_type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedAddress.receiver_phone ||
                            "Chưa có số điện thoại"}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                          {selectedAddress.address}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Địa chỉ giao hàng
                  </label>
                  <Input
                    value={form.address}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedAddressId(null);
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
                    <p className="text-sm text-red-500 mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium mb-3 block">
                Phương thức thanh toán
              </label>
              {paymentValidation && (
                <div
                  className={`mb-3 p-3 rounded-lg text-sm ${
                    paymentValidation.forcePayOS
                      ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                      : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  <p className="font-medium">{paymentValidation.message}</p>
                  {paymentValidation.reason && (
                    <p className="text-xs mt-1 opacity-75">
                      {paymentValidation.reason}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsReputationDialogOpen(true)}
                    className="mt-2 font-bold underline underline-offset-2 hover:opacity-80"
                  >
                    Xem chi tiết về cách xét điểm uy tín
                  </button>
                </div>
              )}
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
                    icon: (
                      <img
                        src={PayOSLogo}
                        alt="PayOS"
                        className="w-20 object-contain"
                      />
                    ),
                  },
                ].map((opt) => {
                  const isDisabled =
                    opt.value === "cash" &&
                    paymentValidation &&
                    !paymentValidation.canUseCash;

                  const selected = form.payment_method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          setForm((prev) => ({
                            ...prev,
                            payment_method: opt.value,
                          }));
                        }
                      }}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        isDisabled
                          ? "border-gray-200  bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                          : selected
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                            : "border-gray-200  bg-white dark:bg-gray-900 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isDisabled
                            ? "bg-gray-200"
                            : selected
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        {isDisabled ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">✕</span>
                        ) : (
                          opt.icon
                        )}
                      </span>
                      <span>
                        <span
                          className={`block text-sm font-medium ${
                            isDisabled ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {opt.label}
                          {isDisabled && " (Không khả dụng)"}
                        </span>
                        <span
                          className={`block text-xs ${
                            isDisabled ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {opt.sub}
                        </span>
                      </span>
                      <span
                        className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${
                          isDisabled
                            ? "border-gray-300 bg-gray-300"
                            : selected
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/200"
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

          <div className="border rounded-2xl p-5 bg-gray-50 dark:bg-gray-950 h-fit">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Đơn hàng</h2>

            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.size} x {item.quantity}
                    </p>

                    {Array.isArray(item.toppings) &&
                      item.toppings.length > 0 && (
                        <div className="mt-1">
                          {item.toppings.map((topping) => (
                            <p
                              key={topping.topping_id}
                              className="text-xs text-gray-500 dark:text-gray-400"
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
                  onChange={(e) => {
                    setDiscountCode(e.target.value);
                    setAppliedDiscount(null);
                    setForm((prev) => ({
                      ...prev,
                      discount_code: "",
                    }));
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyDiscount}
                  disabled={isApplyingDiscount || subtotalAmount <= 0}
                >
                  {isApplyingDiscount ? "Đang áp dụng..." : "Áp dụng"}
                </Button>
              </div>

              {appliedDiscount && (
                <p className="text-xs text-green-600 mt-2">
                  Đã áp dụng mã {appliedDiscount.code} giảm{" "}
                  {discountAmount.toLocaleString("vi-VN")}đ
                </p>
              )}
            </div>

            <div className="space-y-3 border-t pt-4 mb-4">
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Tạm tính</span>
                <span>{subtotalAmount.toLocaleString("vi-VN")}đ</span>
              </div>

              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
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

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chọn địa chỉ giao hàng</DialogTitle>
            <DialogDescription>
              Chọn một địa chỉ đã lưu để tự động điền thông tin giao hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {addresses.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 border rounded-xl p-4 bg-gray-50 dark:bg-gray-950">
                Bạn chưa có địa chỉ đã lưu.
              </div>
            ) : (
              addresses.map((item) => {
                const isSelected = selectedAddressId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAddress(item)}
                    className={`w-full text-left border rounded-xl p-4 transition ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-gray-200  hover:border-gray-300 bg-white dark:bg-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.receiver_name || "Địa chỉ giao hàng"}
                        </p>
                        {Number(item.is_default) === 1 && (
                          <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getAddressTypeLabel(item.address_type)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.receiver_phone || "Chưa có số điện thoại"}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{item.address}</p>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReputationScoreDialog
        open={isReputationDialogOpen}
        onClose={() => setIsReputationDialogOpen(false)}
        currentScore={reputationScore}
        currentTier={normalizedReputationTier}
      />

      <Footer />
    </div>
  );
}
