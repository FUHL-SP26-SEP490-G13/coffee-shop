import { CreditCard, ShieldCheck, Clock, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";


import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Link } from "react-router-dom";

export default function PaymentPolicyPage() {
  useDocumentTitle("Chính sách thanh toán");
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-6 xl:px-8 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
        <div className="flex items-center gap-2 text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium mb-6">
          <Link to="/" className="hover:text-amber-600 transition">Trang chủ</Link>
          <span className="text-gray-400">/</span>
          <span className="text-amber-600 font-bold">Chính sách thanh toán</span>
        </div>



        {/* Content */}
        <div className="w-full">
          <Card className="p-6 md:p-8 space-y-8 border-border">
            <div className="flex gap-4">
              <CreditCard className="w-6 h-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-base md:text-lg mb-2 text-gray-900 dark:text-gray-100">
                  1. Phương thức thanh toán
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  Hỗ trợ thanh toán bằng tiền mặt và PayOS. Vui lòng chọn phương thức phù hợp khi đặt hàng.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-base md:text-lg mb-2 text-gray-900 dark:text-gray-100">
                  2. Bảo mật thông tin
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  Thông tin thanh toán được mã hóa và bảo mật theo tiêu chuẩn an
                  toàn dữ liệu.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="w-6 h-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-base md:text-lg mb-2 text-gray-900 dark:text-gray-100">
                  3. Thời gian xử lý
                </h2>
                <p className="text-gray-700 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  Đơn hàng được xử lý sau khi hệ thống xác nhận thanh toán thành
                  công.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      
    </div>
  );
}
