import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import orderOnlineService from "@/services/orderOnlineService";

export default function QrOrderPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status");
  const cancel = searchParams.get("cancel");

  useEffect(() => {
    const isCancelled =
      String(status || "").toUpperCase() === "CANCELLED" ||
      String(cancel || "").toLowerCase() === "true";

    if (isCancelled) {
      // PayOS có thể redirect nhầm về success page với status=CANCELLED
      sessionStorage.removeItem("qr_pending_cart");
      return;
    }

    const cartData = (() => {
      try {
        return JSON.parse(sessionStorage.getItem("qr_pending_cart") || "null");
      } catch {
        return null;
      }
    })();

    if (cartData && !confirmed) {
      setConfirmed(true);
      orderOnlineService
        .confirmQrAfterPayment(cartData)
        .then(() => {
          sessionStorage.removeItem("qr_pending_cart");
        })
        .catch((err) => {
          console.error("Lưu đơn hàng sau thanh toán thất bại:", err);
          setError("Đã thanh toán thành công nhưng không thể lưu đơn. Vui lòng liên hệ nhân viên.");
        });
    }

    // Trigger confetti
    const end = Date.now() + 3 * 1000;
    const colors = ["#f59e0b", "#d97706", "#fbbf24"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 px-4 py-12 items-center justify-center">
      <Card className="w-full max-w-md p-8 shadow-xl border-none bg-white dark:bg-gray-900 rounded-3xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
            <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cảm ơn bạn đã đặt món tại quán. Đơn hàng của bạn đang được chuẩn bị và sẽ được phục vụ sớm nhất.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
              <Badge className="bg-green-100 text-green-700 border-none">Đã thanh toán</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
