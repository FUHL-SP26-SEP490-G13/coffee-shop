import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  FileText,
  Users,
  Shield,
  UserCheck,
  Database,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  Lock,
  Eye,
  Trash2
} from "lucide-react";

function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              Bảo mật & Quyền riêng tư
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Chính sách bảo mật
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn một cách an toàn và minh bạch
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Mục đích thu thập */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    1. Mục đích thu thập thông tin
                  </h2>
                  <p className="text-muted-foreground">
                    Coffee Shop thu thập thông tin cá nhân của khách hàng nhằm:
                  </p>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Xử lý đơn hàng và giao hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Quản lý tài khoản khách hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Hỗ trợ chăm sóc khách hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Gửi thông tin khuyến mãi và bản tin (nếu khách hàng đăng ký).</span>
                </li>
              </ul>
            </Card>

            {/* 2. Phạm vi thu thập */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    2. Phạm vi thông tin thu thập
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Họ và tên.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Số điện thoại.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Địa chỉ giao hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Lịch sử đơn hàng.</span>
                </li>
              </ul>
            </Card>

            {/* 3. Phạm vi sử dụng */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    3. Phạm vi sử dụng thông tin
                  </h2>
                </div>
              </div>

              <div className="pl-4 md:pl-16">
                <p className="text-muted-foreground mb-4">
                  Thông tin khách hàng chỉ được sử dụng nội bộ nhằm phục vụ hoạt động kinh doanh và chăm sóc khách hàng.
                </p>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-medium flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                    <span>Coffee Shop cam kết không chia sẻ thông tin cá nhân cho bên thứ ba nếu không có sự đồng ý của khách hàng, trừ trường hợp pháp luật yêu cầu.</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* 4. Bảo mật thông tin */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    4. Bảo mật thông tin
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Coffee Shop áp dụng các biện pháp bảo mật phù hợp nhằm bảo vệ thông tin cá nhân của khách hàng khỏi truy cập trái phép, mất mát hoặc rò rỉ dữ liệu.
                  </p>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Mã hóa mật khẩu người dùng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Giới hạn quyền truy cập dữ liệu nội bộ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Sử dụng kết nối bảo mật HTTPS.</span>
                </li>
              </ul>
            </Card>

            {/* 5. Quyền của khách hàng */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    5. Quyền của khách hàng
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Yêu cầu chỉnh sửa hoặc cập nhật thông tin cá nhân.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Yêu cầu xóa tài khoản.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Từ chối nhận email quảng cáo bất cứ lúc nào.</span>
                </li>
              </ul>
            </Card>

            {/* 6. Lưu trữ thông tin */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-lg">
                  <Database className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    6. Lưu trữ thông tin
                  </h2>
                </div>
              </div>

              <div className="pl-4 md:pl-16">
                <p className="text-muted-foreground">
                  Thông tin cá nhân được lưu trữ trong hệ thống cho đến khi khách hàng yêu cầu xóa hoặc tài khoản không còn hoạt động trong thời gian dài.
                </p>
              </div>
            </Card>

            {/* 7. Liên hệ */}
            <Card className="p-6 md:p-8 border-border bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    7. Thông tin liên hệ
                  </h2>
                  <p className="text-muted-foreground">
                    Nếu có bất kỳ thắc mắc nào về chính sách bảo mật, vui lòng liên hệ:
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-4 md:pl-16">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm md:text-base">TP. Hà Nội</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm md:text-base font-medium">0123 456 789</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm md:text-base">support@coffeeshop.vn</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-card rounded-lg border border-border ml-4 md:ml-16">
                <p className="font-semibold text-center flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Coffee Shop cam kết bảo vệ thông tin khách hàng một cách an toàn và minh bạch.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PrivacyPolicy;
