import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clock,
  XCircle,
  RefreshCcw,
  CreditCard,
  UserCheck,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
} from "lucide-react";

function OrderPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== HERO ===== */}
      <section className="w-full pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-amber-600 to-amber-400">
            <div className="h-72 sm:h-80 lg:h-96 flex flex-col justify-center items-center text-center px-6">
              <Badge className="mb-4 bg-white/20 text-white border-none">
                Chính sách
              </Badge>
              <h1 className="text-2xl sm:text-3xl text-white mb-3">
                Chính sách đặt hàng
              </h1>
              <p className="text-sm sm:text-base text-white/90 max-w-xl">
                Thông tin chi tiết về quy trình đặt hàng, thanh toán và hỗ trợ
                khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTENT ===== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* 1 */}
          <PolicyCard icon={<ShoppingBag />} title="1. Hình thức đặt hàng">
            <ul className="space-y-2">
              <li>• Đặt online giao tận nơi hoặc nhận tại quán.</li>
              <li>• Gọi món trực tiếp tại quầy.</li>
              <li>• Hệ thống gửi xác nhận sau khi đặt thành công.</li>
            </ul>
          </PolicyCard>

          {/* 2 */}
          <PolicyCard icon={<Clock />} title="2. Thời gian xử lý">
            <ul className="space-y-2">
              <li>• Xác nhận đơn trong 5–15 phút.</li>
              <li>• Giao hàng phụ thuộc khu vực.</li>
              <li>• Giờ cao điểm có thể chậm hơn.</li>
            </ul>
          </PolicyCard>

          {/* 3 */}
          <PolicyCard icon={<XCircle />} title="3. Chính sách hủy đơn">
            <ul className="space-y-2">
              <li>• Được hủy trước khi bắt đầu pha chế.</li>
              <li>• Không hỗ trợ hủy sau khi đã chế biến.</li>
            </ul>
          </PolicyCard>

          {/* 4 */}
          <PolicyCard icon={<RefreshCcw />} title="4. Đổi trả & hoàn tiền">
            <ul className="space-y-2">
              <li>• Sai món hoặc sản phẩm lỗi.</li>
              <li>• Hư hỏng khi giao hàng.</li>
              <li>• Thông báo trong 24 giờ.</li>
            </ul>
          </PolicyCard>

          {/* 5 */}
          <PolicyCard icon={<CreditCard />} title="5. Thanh toán">
            <ul className="space-y-2">
              <li>• Tiền mặt tại quầy.</li>
              <li>• QR / chuyển khoản.</li>
              <li>• Thanh toán online (nếu có).</li>
            </ul>
          </PolicyCard>

          {/* 6 */}
          <PolicyCard icon={<UserCheck />} title="6. Trách nhiệm khách hàng">
            <ul className="space-y-2">
              <li>• Cung cấp thông tin chính xác.</li>
              <li>• Kiểm tra sản phẩm khi nhận.</li>
              <li>• Bảo quản đúng hướng dẫn.</li>
            </ul>
          </PolicyCard>

        </div>
      </section>

      {/* Divider giống Home */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <Footer />
    </div>
  );
}

/* Reusable Policy Card */
function PolicyCard({ icon, title, children }) {
  return (
    <Card className="rounded-3xl shadow-xl border border-gray-200 hover:border-amber-300 transition-all duration-300 p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">{icon}</div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {title}
        </h2>
      </div>
      <div className="text-sm sm:text-base text-gray-600 leading-relaxed">
        {children}
      </div>
    </Card>
  );
}

export default OrderPolicy;
