import { CreditCard, ShieldCheck, Clock, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PaymentPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 mb-10">
        {/* Title */}
        <div className="text-center space-y-3 mt-4 mb-10">
          <h1 className="flex items-center text-primary justify-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Chính sách thanh toán
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Quy định về phương thức và quy trình thanh toán khi mua hàng
          </p>
        </div>

        {/* Content */}
        <div className="w-full">
          <Card className="p-6 md:p-8 space-y-8 border-border">
            <div className="flex gap-4">
              <CreditCard className="text-primary mt-1" />
              <div>
                <h2 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">
                  1. Phương thức thanh toán
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  Hỗ trợ thanh toán bằng tiền mặt và PayOS. Vui lòng chọn phương thức phù hợp khi đặt hàng.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <ShieldCheck className="text-primary mt-1" />
              <div>
                <h2 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">
                  2. Bảo mật thông tin
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  Thông tin thanh toán được mã hóa và bảo mật theo tiêu chuẩn an
                  toàn dữ liệu.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="text-primary mt-1" />
              <div>
                <h2 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">
                  3. Thời gian xử lý
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  Đơn hàng được xử lý sau khi hệ thống xác nhận thanh toán thành
                  công.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      <Footer />
    </div>
  );
}
