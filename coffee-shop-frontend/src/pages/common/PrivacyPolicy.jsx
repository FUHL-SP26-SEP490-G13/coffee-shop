import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Database,
  Lock,
  Users,
  FileText,
  UserCheck,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="text-center space-y-3 mt-10">
        <h1 className="text-2xl md:text-3xl text-primary">
          Chính sách bảo mật
        </h1>
        <p className="text-gray-600 text-sm">
          Cam kết minh bạch trong việc thu thập, sử dụng và bảo vệ thông tin cá
          nhân.
        </p>
      </div>

      {/* ===== CONTENT ===== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          <PolicyCard icon={<Database />} title="Thu thập thông tin">
            Chúng tôi thu thập họ tên, email, số điện thoại, địa chỉ giao hàng
            và lịch sử đơn hàng nhằm phục vụ hoạt động kinh doanh.
          </PolicyCard>

          <PolicyCard icon={<Users />} title="Mục đích sử dụng">
            Dữ liệu được sử dụng để xử lý đơn hàng, chăm sóc khách hàng và gửi
            thông tin khuyến mãi khi có sự đồng ý.
          </PolicyCard>

          <PolicyCard icon={<FileText />} title="Phạm vi sử dụng">
            Thông tin chỉ được sử dụng nội bộ và không chia sẻ cho bên thứ ba
            nếu không có sự đồng ý hoặc yêu cầu pháp luật.
          </PolicyCard>

          <PolicyCard icon={<Lock />} title="Biện pháp bảo mật">
            Mã hóa mật khẩu, sử dụng HTTPS và giới hạn quyền truy cập nội bộ
            nhằm đảm bảo an toàn dữ liệu.
          </PolicyCard>

          <PolicyCard icon={<UserCheck />} title="Quyền của khách hàng">
            Bạn có quyền chỉnh sửa, yêu cầu xóa thông tin hoặc từ chối nhận
            email quảng cáo bất kỳ lúc nào.
          </PolicyCard>

          <PolicyCard icon={<Shield />} title="Lưu trữ thông tin">
            Dữ liệu được lưu trữ cho đến khi khách hàng yêu cầu xóa hoặc tài
            khoản không còn hoạt động.
          </PolicyCard>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <Footer />
    </div>
  );
}

/* Reusable Card */
function PolicyCard({ icon, title, children }) {
  return (
    <Card className="rounded-3xl shadow-xl border border-gray-200 hover:border-amber-300 transition-all duration-300 p-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">{icon}</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
          {title}
        </h3>
      </div>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
        {children}
      </p>
    </Card>
  );
}

export default PrivacyPolicy;
