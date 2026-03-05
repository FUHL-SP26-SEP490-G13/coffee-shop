import { RotateCcw, Package, AlertCircle, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ReturnPolicyPage() {
  return (
    <>
    <Header />  
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl text-primary">
            Chính sách hoàn trả
          </h1>
          <p className="text-gray-600 text-sm">
            Quy định về đổi trả và hoàn tiền sản phẩm
          </p>
        </div>

        {/* Content */}
        <Card className="p-6 md:p-8 space-y-8 border-border">
          <div className="flex gap-4">
            <RotateCcw className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                1. Điều kiện hoàn trả
              </h2>
              <p className="text-gray-700 text-sm">
                Sản phẩm còn nguyên tem, chưa qua sử dụng và trong vòng 7 ngày
                kể từ ngày nhận hàng.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Package className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                2. Quy trình đổi trả
              </h2>
              <p className="text-gray-700 text-sm">
                Liên hệ bộ phận hỗ trợ để được hướng dẫn gửi trả sản phẩm.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <AlertCircle className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                3. Thời gian hoàn tiền
              </h2>
              <p className="text-gray-700 text-sm">
                Hoàn tiền trong vòng 3-7 ngày làm việc sau khi kiểm tra sản
                phẩm.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6 border-border bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>Hotline: 0123 456 789</span>
            </div>
            <div>Email: support@yourshop.com</div>
          </div>
        </Card>
      </div>
      <Footer />
    </>
  );
}
