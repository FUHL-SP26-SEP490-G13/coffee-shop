import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
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
  Store,
  Truck
} from "lucide-react";

function OrderPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              Chính sách
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Chính sách đặt hàng
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tìm hiểu về quy trình đặt hàng, thanh toán và các chính sách hỗ trợ khách hàng tại Coffee Shop
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Hình thức đặt hàng */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    1. Hình thức đặt hàng
                  </h2>
                  <p className="text-muted-foreground">
                    Coffee Shop hỗ trợ khách hàng đặt sản phẩm thông qua website hoặc mua trực tiếp tại cửa hàng.
                  </p>
                </div>
              </div>

              <div className="space-y-6 pl-4 md:pl-16">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Đặt hàng online</h3>
                  </div>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Đặt giao tận nơi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Đặt nhận tại quán (Pickup).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Hệ thống sẽ gửi xác nhận đơn hàng sau khi đặt thành công.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Uống tại quán</h3>
                  </div>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Gọi món trực tiếp tại quầy.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Thanh toán tiền mặt hoặc QR Code thông qua dịch vụ PayOS.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 2. Thời gian xử lý */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    2. Thời gian xử lý đơn hàng
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Đơn online được xác nhận trong vòng 5–15 phút.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Thời gian giao hàng phụ thuộc khu vực và tình hình thực tế.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Đơn tại quán được phục vụ theo thứ tự.</span>
                </li>
              </ul>

              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg ml-4 md:ml-16">
                <p className="text-sm text-amber-800 dark:text-amber-600">
                  ⚠️ Trong giờ cao điểm, thời gian xử lý có thể kéo dài hơn dự kiến.
                </p>
              </div>
            </Card>

            {/* 3. Chính sách hủy đơn */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    3. Chính sách hủy đơn
                  </h2>
                </div>
              </div>

              <div className="space-y-4 pl-4 md:pl-16">
                <div>
                  <h3 className="font-semibold mb-2">Đối với đơn online</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Khách hàng có thể hủy trước khi cửa hàng bắt đầu pha chế.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Sau khi đã pha chế, không hỗ trợ hủy.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Đối với đơn tại quán</h3>
                  <ul className="space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">Không hỗ trợ hủy sau khi đã thanh toán và bắt đầu chế biến.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 4. Đổi trả và hoàn tiền */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <RefreshCcw className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    4. Chính sách đổi trả và hoàn tiền
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Coffee Shop hỗ trợ đổi/trả trong các trường hợp sau:
                  </p>
                </div>
              </div>

              <div className="pl-4 md:pl-16 space-y-4">
                <ul className="space-y-2 text-sm md:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Sản phẩm bị sai món.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Sản phẩm bị hư hỏng trong quá trình giao hàng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">Sản phẩm không đảm bảo chất lượng.</span>
                  </li>
                </ul>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                  <p className="text-sm">
                    📝 Khách hàng cần thông báo trong vòng <strong>24 giờ</strong> và cung cấp hóa đơn hoặc hình ảnh liên quan.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ⚠️ Không áp dụng hoàn tiền cho các trường hợp thay đổi ý định mua hàng hoặc sản phẩm đã sử dụng quá 50%.
                  </p>
                </div>
              </div>
            </Card>

            {/* 5. Thanh toán */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    5. Thanh toán
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Thanh toán tiền mặt tại quầy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Thanh toán chuyển khoản hoặc QR Code thông qua dịch vụ PayOS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Thanh toán online (nếu có).</span>
                </li>
              </ul>
            </Card>

            {/* 6. Trách nhiệm khách hàng */}
            <Card className="p-6 md:p-8 border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    6. Trách nhiệm của khách hàng
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 pl-4 md:pl-16 text-sm md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Cung cấp thông tin giao hàng chính xác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Kiểm tra sản phẩm khi nhận hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Bảo quản sản phẩm đúng hướng dẫn.</span>
                </li>
              </ul>
            </Card>

            {/* 7. Liên hệ hỗ trợ */}
            <Card className="p-6 md:p-8 border-border bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2">
                    7. Liên hệ hỗ trợ
                  </h2>
                  <p className="text-muted-foreground">
                    Chúng tôi luôn sẵn sàng hỗ trợ bạn
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-4 md:pl-16">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm md:text-base">TP. Hồ Chí Minh</span>
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
                <p className="font-semibold text-center">
                  ☕ Coffee Shop cam kết mang đến trải nghiệm tốt nhất cho khách hàng.
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

export default OrderPolicy;
