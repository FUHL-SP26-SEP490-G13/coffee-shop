import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ShoppingBag, Home, ReceiptText } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import orderService from "@/services/orderOnlineService";

// PayOS trả về query params:
// code=00 (thành công) / code khác (thất bại)
// cancel=true (người dùng huỷ)
// status=PAID | CANCELLED | PENDING
// orderCode, id
const STATUS_MAP = {
  PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
  PENDING: { label: "Đang chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
};

export default function PayOSReturnSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code       = searchParams.get("code");        // "00" = success
  const cancel     = searchParams.get("cancel");      // "true" nếu huỷ
  const status     = searchParams.get("status");      // PAID | CANCELLED | PENDING
  const orderCode  = searchParams.get("orderCode");
  const payosId    = searchParams.get("id");

  // Xác định trạng thái
  const isCancelled = cancel === "true" || status === "CANCELLED";
  const isSuccess   = !isCancelled && (code === "00" || status === "PAID");
  const isPending   = !isCancelled && !isSuccess;

  const [countdown, setCountdown] = useState(8);

  // Lưu mã giao dịch PayOS vào DB ngay khi trang load
  useEffect(() => {
    if (!orderCode) return;
    orderService
      .savePayosReturn({ orderCode, payosId, status, cancel })
      .catch((err) => console.error("Lưu mã giao dịch thất bại:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự động điều hướng sau 8s nếu thành công
  useEffect(() => {
    if (!isSuccess) return;

    // Trigger confetti
    const end = Date.now() + 2 * 1000;
    const colors = ['#f59e0b', '#d97706', '#fbbf24'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg p-8 shadow-md border-border space-y-6">

          {/* Icon + tiêu đề */}
          <div className="flex flex-col items-center gap-3 text-center">
            {isSuccess && (
              <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={1.5} />
            )}
            {isCancelled && (
              <XCircle className="w-16 h-16 text-red-400" strokeWidth={1.5} />
            )}
            {isPending && (
              <Clock className="w-16 h-16 text-yellow-500" strokeWidth={1.5} />
            )}

            <h1 className="text-2xl font-semibold text-gray-800">
              {isSuccess  && "Thanh toán thành công!"}
              {isCancelled && "Thanh toán đã bị huỷ"}
              {isPending  && "Đang chờ xác nhận thanh toán"}
            </h1>

            <p className="text-sm text-gray-500">
              {isSuccess  && "Hệ thống đã ghi nhận giao dịch của bạn. Cảm ơn bạn đã tin tưởng chúng tôi!"}
              {isCancelled && "Bạn đã huỷ giao dịch thanh toán. Nếu có vấn đề, vui lòng liên hệ hỗ trợ."}
              {isPending  && "Giao dịch của bạn đang được xử lý. Vui lòng chờ trong giây lát."}
            </p>
          </div>

          {/* Thông tin giao dịch */}
          {(orderCode || payosId || status) && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 divide-y divide-gray-100 text-sm">
              {orderCode && (
                <InfoRow label="Mã đơn hàng" value={`#${orderCode}`} />
              )}
              {payosId && (
                <InfoRow label="Mã giao dịch PayOS" value={payosId} copy />
              )}
              {status && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-gray-500">Trạng thái</span>
                  <Badge
                    className={
                      STATUS_MAP[status]?.color ||
                      "bg-gray-100 text-gray-600"
                    }
                  >
                    {STATUS_MAP[status]?.label || status}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Đếm ngược */}
          {isSuccess && countdown > 0 && (
            <p className="text-center text-xs text-gray-400">
              Tự động chuyển về trang chủ sau{" "}
              <span className="font-medium text-primary">{countdown}s</span>
            </p>
          )}

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1 gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Về trang chủ
              </Link>
            </Button>

            {isSuccess ? (
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link to="/my-orders">
                  <ReceiptText className="w-4 h-4" />
                  Xem đơn hàng
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link to="/checkout">
                  <ShoppingBag className="w-4 h-4" />
                  Thử lại
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

/* Hàng thông tin nhỏ trong card */
function InfoRow({ label, value, copy = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-800">{value}</span>
        {copy && (
          <button
            onClick={handleCopy}
            className="text-xs text-primary hover:underline"
          >
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
        )}
      </div>
    </div>
  );
}
