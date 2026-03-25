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

      <div className="text-center space-y-3 mt-10">
        <h1 className="text-2xl md:text-3xl text-primary font-bold">
          Chính sách đặt hàng
        </h1>
        <p className="text-gray-600 text-sm">
          Thông tin chi tiết về quy trình đặt hàng, thanh toán và hỗ trợ khách
          hàng.
        </p>
      </div>

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
            <span>
              Quý khách có thể yêu cầu hủy đơn hàng khi đơn ở trạng thái Chờ xử
              lý hoặc Đang chuẩn bị. Chính sách hoàn tiền đối với các đơn đã
              thanh toán trước được áp dụng như sau:{" "}
            </span>
            <ul className="space-y-2 my-4">
              <li>
                • Hoàn <strong>100% </strong> giá trị đơn hàng: Nếu đơn hàng chưa được xác nhận hoặc
                chưa bắt đầu chế biến.{" "}
              </li>
              <li>
                • Hoàn <strong>50% </strong> giá trị đơn hàng: Nếu đơn hàng đã chuyển sang trạng
                thái Đang chuẩn bị (nhằm bù đắp chi phí nguyên liệu và công vận
                hành đã phát sinh).
              </li>
            </ul>
            <span>Trường hợp hoàn tiền hãy liên hệ với chúng tôi qua số điện thoại hoặc Zalo trong vòng 24 giờ kể từ khi nhận được đơn hàng.</span>
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
              <li>
                • QR / chuyển khoản trực tuyến thông qua hệ thống thanh toán
                PayOS
              </li>
            </ul>
          </PolicyCard>

          {/* 6 */}
          <PolicyCard icon={<UserCheck />} title="6. Trách nhiệm khách hàng">
            <ul className="space-y-2">
              <li>• Cung cấp thông tin chính xác.</li>
              <li>• Kiểm tra sản phẩm khi nhận.</li>
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
