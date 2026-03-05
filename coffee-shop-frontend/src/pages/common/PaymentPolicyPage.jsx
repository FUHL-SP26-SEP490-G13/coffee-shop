import { CreditCard, ShieldCheck, Clock, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PaymentPolicyPage() {
  return (
    <>
    <Header />
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl text-primary">
          Chính sách thanh toán
        </h1>
        <p className="text-gray-600 text-sm">
          Quy định về phương thức và quy trình thanh toán khi mua hàng
        </p>
      </div>

      {/* Content */}
      <Card className="p-6 md:p-8 space-y-8 border-border">
        <div className="flex gap-4">
          <CreditCard className="text-primary mt-1" />
          <div>
            <h2 className="font-semibold text-base mb-2">
              1. Phương thức thanh toán
            </h2>
            <p className="text-gray-700 text-sm">
              Hỗ trợ chuyển khoản ngân hàng, ví điện tử và thanh toán khi nhận
              hàng (COD).
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <ShieldCheck className="text-primary mt-1" />
          <div>
            <h2 className="font-semibold text-base mb-2">
              2. Bảo mật thông tin
            </h2>
            <p className="text-gray-700 text-sm">
              Thông tin thanh toán được mã hóa và bảo mật theo tiêu chuẩn an
              toàn dữ liệu.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Clock className="text-primary mt-1" />
          <div>
            <h2 className="font-semibold text-base mb-2">3. Thời gian xử lý</h2>
            <p className="text-gray-700 text-sm">
              Đơn hàng được xử lý sau khi hệ thống xác nhận thanh toán thành
              công.
            </p>
          </div>
        </div>
      </Card>

    </div>
    <Footer />
    </>
  );
}
