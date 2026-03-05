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

      {/* ===== HERO ===== */}
      <section className="w-full pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-amber-600 to-amber-400">
            <div className="h-72 sm:h-80 lg:h-96 flex flex-col justify-center items-center text-center px-6">
              <h1 className="text-2xl sm:text-3xl text-white mb-3">
                Chính sách bảo mật
              </h1>
              <p className="text-sm sm:text-base text-white/90 max-w-xl">
                Cam kết minh bạch trong việc thu thập, sử dụng và bảo vệ thông
                tin cá nhân.
              </p>
            </div>
          </div>
        </div>
      </section>

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

        {/* CONTACT */}
        <div className="mt-16 rounded-3xl shadow-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-200 p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-900">
            Liên hệ hỗ trợ
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm sm:text-base text-gray-700">
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="w-5 h-5 text-amber-600" />
              TP. Hà Nội
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Phone className="w-5 h-5 text-amber-600" />
              0123 456 789
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
              support@coffeeshop.vn
            </div>
          </div>
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
