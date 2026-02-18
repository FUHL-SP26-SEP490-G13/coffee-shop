import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

function OrderPolicy() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 leading-7">
        <h1 className="text-3xl font-bold mb-10">Chính sách đặt hàng</h1>

        {/* 1 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            1. Hình thức đặt hàng
          </h2>

          <p className="mb-4">
            Coffee Shop hỗ trợ khách hàng đặt sản phẩm thông qua website hoặc
            mua trực tiếp tại cửa hàng.
          </p>

          <h3 className="font-semibold mt-4 mb-2">• Đặt hàng online</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Đặt giao tận nơi.</li>
            <li>Đặt nhận tại quán (Pickup).</li>
            <li>Hệ thống sẽ gửi xác nhận đơn hàng sau khi đặt thành công.</li>
          </ul>

          <h3 className="font-semibold mt-6 mb-2">• Uống tại quán</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Gọi món trực tiếp tại quầy.</li>
            <li>Thanh toán tiền mặt hoặc QR Code.</li>
          </ul>
        </section>

        {/* 2 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            2. Thời gian xử lý đơn hàng
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Đơn online được xác nhận trong vòng 5–15 phút.</li>
            <li>Thời gian giao hàng phụ thuộc khu vực và tình hình thực tế.</li>
            <li>Đơn tại quán được phục vụ theo thứ tự.</li>
          </ul>

          <p className="mt-4 text-gray-700">
            Trong giờ cao điểm, thời gian xử lý có thể kéo dài hơn dự kiến.
          </p>
        </section>

        {/* 3 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            3. Chính sách hủy đơn
          </h2>

          <h3 className="font-semibold mt-4 mb-2">• Đối với đơn online</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Khách hàng có thể hủy trước khi cửa hàng bắt đầu pha chế.</li>
            <li>Sau khi đã pha chế, không hỗ trợ hủy.</li>
          </ul>

          <h3 className="font-semibold mt-6 mb-2">• Đối với đơn tại quán</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Không hỗ trợ hủy sau khi đã thanh toán và bắt đầu chế biến.</li>
          </ul>
        </section>

        {/* 4 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            4. Chính sách đổi trả và hoàn tiền
          </h2>

          <p className="mb-3 text-gray-700">
            Coffee Shop hỗ trợ đổi/trả trong các trường hợp sau:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Sản phẩm bị sai món.</li>
            <li>Sản phẩm bị hư hỏng trong quá trình giao hàng.</li>
            <li>Sản phẩm không đảm bảo chất lượng.</li>
          </ul>

          <p className="mt-4 text-gray-700">
            Khách hàng cần thông báo trong vòng 24 giờ và cung cấp hóa đơn hoặc
            hình ảnh liên quan.
          </p>

          <p className="mt-4 text-gray-700">
            Không áp dụng hoàn tiền cho các trường hợp thay đổi ý định mua hàng
            hoặc sản phẩm đã sử dụng quá 50%.
          </p>
        </section>

        {/* 5 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            5. Thanh toán
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Thanh toán tiền mặt tại quầy.</li>
            <li>Thanh toán chuyển khoản hoặc QR Code.</li>
            <li>Thanh toán online (nếu có).</li>
          </ul>
        </section>

        {/* 6 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            6. Trách nhiệm của khách hàng
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Cung cấp thông tin giao hàng chính xác.</li>
            <li>Kiểm tra sản phẩm khi nhận hàng.</li>
            <li>Bảo quản sản phẩm đúng hướng dẫn.</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            7. Liên hệ hỗ trợ
          </h2>

          <p className="text-gray-700">📍 Địa chỉ: TP. Hồ Chí Minh</p>
          <p className="text-gray-700">📞 Hotline: 0123 456 789</p>
          <p className="text-gray-700">📧 Email: support@coffeeshop.vn</p>

          <p className="mt-4 font-medium">
            Coffee Shop cam kết mang đến trải nghiệm tốt nhất cho khách hàng.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default OrderPolicy;
