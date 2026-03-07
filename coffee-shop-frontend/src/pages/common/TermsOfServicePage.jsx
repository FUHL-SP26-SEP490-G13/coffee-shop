import { FileText, UserCheck, AlertTriangle, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function TermsOfServicePage() {
  return (
    <>
    <Header />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl text-primary">
            Điều khoản sử dụng
          </h1>
          <p className="text-gray-600 text-sm">
            Quy định và điều kiện khi sử dụng dịch vụ của chúng tôi
          </p>
        </div>

        {/* Content */}
        <Card className="p-6 md:p-8 space-y-8 border-border">
          <div className="flex gap-4">
            <FileText className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                1. Điều kiện sử dụng
              </h2>
              <p className="text-gray-700 text-sm">
                Người dùng phải cung cấp thông tin chính xác và chịu trách nhiệm
                với tài khoản của mình.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <UserCheck className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                2. Quyền và nghĩa vụ
              </h2>
              <p className="text-gray-700 text-sm">
                Không sử dụng hệ thống cho mục đích gian lận hoặc vi phạm pháp
                luật.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <AlertTriangle className="text-primary mt-1" />
            <div>
              <h2 className="font-semibold text-base mb-2">
                3. Giới hạn trách nhiệm
              </h2>
              <p className="text-gray-700 text-sm">
                Chúng tôi không chịu trách nhiệm với thiệt hại phát sinh do sử
                dụng sai mục đích.
              </p>
            </div>
          </div>
        </Card>

      </div>
      <Footer />
    </>
  );
}
