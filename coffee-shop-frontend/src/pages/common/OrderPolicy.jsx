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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 mb-10">
        <div className="text-center space-y-3 mt-4 mb-10">
          <h1 className="text-2xl md:text-3xl text-primary font-bold">
            Chính sách đặt hàng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Thông tin chi tiết về quy trình đặt hàng, thanh toán và hỗ trợ khách
            hàng.
          </p>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="w-full space-y-10">
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
              <li>
                • Khách hàng được hủy đơn khi đơn đang ở trạng thái <strong>Chờ xác nhận (pending)</strong> hoặc <strong>Đang chuẩn bị (preparing)</strong>.
              </li>
              <li>
                • Khi đơn đã chuyển sang các trạng thái khác (ví dụ: đang giao, hoàn tất), hệ thống sẽ không cho hủy từ phía khách hàng.
              </li>
              <li>
                • Với thanh toán PayOS, đơn ở trạng thái chờ thanh toán có thể được hệ thống tự động hủy sau khoảng <strong>5 phút</strong> nếu chưa thanh toán thành công.
              </li>
              <li>
                • Khi đơn bị hủy, hệ thống sẽ đồng bộ lại điểm loyalty (nếu đơn có sử dụng điểm) và có thể bị mất 20 điểm uy tín cho mỗi đơn nếu lý do hủy là do khách hàng.
              </li>
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

          {/* 7 */}
          <PolicyCard icon={<RefreshCcw />} title="7. Chính sách tích và đổi điểm loyalty">
            <ul className="space-y-2">
              <li>
                • <strong>Tích điểm:</strong> Khi đơn hàng hoàn tất, hệ thống cộng điểm theo công thức <strong>1 điểm cho mỗi 10.000đ</strong> giá trị đơn.
              </li>
              <li>
                • <strong>Đổi điểm:</strong> Tại bước thanh toán, khách hàng có thể dùng điểm để giảm giá với tỷ lệ <strong>1 điểm = 100đ</strong>.
              </li>
              <li>
                • Chỉ tài khoản đã đăng nhập mới được sử dụng điểm loyalty.
              </li>
              <li>
                • Số điểm sử dụng phải là số nguyên không âm, không vượt quá số điểm hiện có và không vượt quá giá trị đơn hàng cần thanh toán.
              </li>
              <li>
                • <strong>Hoàn điểm khi hủy đơn:</strong> Nếu đơn đã dùng điểm và bị hủy, hệ thống sẽ hoàn lại số điểm đã trừ vào ví loyalty của khách hàng.
              </li>
              <li>
                • Lịch sử điểm được ghi nhận minh bạch theo các loại giao dịch: cộng điểm, trừ điểm, hoàn điểm, điều chỉnh.
              </li>
            </ul>
          </PolicyCard>
        </div>
      </div>

      {/* Divider giống Home */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <Footer />
    </div>
  );
}

/* Reusable Policy Card */
function PolicyCard({ icon, title, children }) {
  return (
    <Card className="rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-500 transition-all duration-300 p-8 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-500">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
    </Card>
  );
}

export default OrderPolicy;
