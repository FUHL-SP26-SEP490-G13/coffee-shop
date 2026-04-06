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
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

function PrivacyPolicy() {
  useDocumentTitle("Chính sách bảo mật");
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-6 xl:px-8 py-10 mb-10">
        <div className="flex items-center gap-2 text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium mb-8 mt-[-10px]">
          <Link to="/" className="hover:text-amber-600 transition">Trang chủ</Link>
          <span className="text-gray-400">/</span>
          <span className="text-amber-600 font-bold">Chính sách bảo mật</span>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="w-full grid gap-8 md:grid-cols-2">
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
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <Footer />
    </div>
  );
}

/* Reusable Card */
function PolicyCard({ icon, title, children }) {
  return (
    <Card className="rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-500 transition-all duration-300 p-8 bg-white dark:bg-gray-950">
      <div className="flex items-start gap-4 mb-2">
        <div className="mt-0.5 p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-500 shrink-0 [&>svg]:w-6 [&>svg]:h-6">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-base md:text-lg mb-1.5 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {children}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default PrivacyPolicy;
