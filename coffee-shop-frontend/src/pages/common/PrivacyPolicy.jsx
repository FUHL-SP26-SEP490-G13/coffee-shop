import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16 leading-7">
        <h1 className="text-3xl font-bold mb-10">Chính sách bảo mật</h1>

        {/* 1 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            1. Mục đích thu thập thông tin
          </h2>

          <p className="text-gray-700">
            Coffee Shop thu thập thông tin cá nhân của khách hàng nhằm:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
            <li>Xử lý đơn hàng và giao hàng.</li>
            <li>Quản lý tài khoản khách hàng.</li>
            <li>Hỗ trợ chăm sóc khách hàng.</li>
            <li>
              Gửi thông tin khuyến mãi và bản tin (nếu khách hàng đăng ký).
            </li>
          </ul>
        </section>

        {/* 2 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            2. Phạm vi thông tin thu thập
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Họ và tên.</li>
            <li>Email.</li>
            <li>Số điện thoại.</li>
            <li>Địa chỉ giao hàng.</li>
            <li>Lịch sử đơn hàng.</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            3. Phạm vi sử dụng thông tin
          </h2>

          <p className="text-gray-700">
            Thông tin khách hàng chỉ được sử dụng nội bộ nhằm phục vụ hoạt động
            kinh doanh và chăm sóc khách hàng. Coffee Shop cam kết không chia sẻ
            thông tin cá nhân cho bên thứ ba nếu không có sự đồng ý của khách
            hàng, trừ trường hợp pháp luật yêu cầu.
          </p>
        </section>

        {/* 4 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            4. Bảo mật thông tin
          </h2>

          <p className="text-gray-700">
            Coffee Shop áp dụng các biện pháp bảo mật phù hợp nhằm bảo vệ thông
            tin cá nhân của khách hàng khỏi truy cập trái phép, mất mát hoặc rò
            rỉ dữ liệu.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
            <li>Mã hóa mật khẩu người dùng.</li>
            <li>Giới hạn quyền truy cập dữ liệu nội bộ.</li>
            <li>Sử dụng kết nối bảo mật HTTPS.</li>
          </ul>
        </section>

        {/* 5 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            5. Quyền của khách hàng
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Yêu cầu chỉnh sửa hoặc cập nhật thông tin cá nhân.</li>
            <li>Yêu cầu xóa tài khoản.</li>
            <li>Từ chối nhận email quảng cáo bất cứ lúc nào.</li>
          </ul>
        </section>

        {/* 6 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            6. Lưu trữ thông tin
          </h2>

          <p className="text-gray-700">
            Thông tin cá nhân được lưu trữ trong hệ thống cho đến khi khách hàng
            yêu cầu xóa hoặc tài khoản không còn hoạt động trong thời gian dài.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold text-[#b71c1c] mb-3">
            7. Thông tin liên hệ
          </h2>

          <p className="text-gray-700">
            Nếu có bất kỳ thắc mắc nào về chính sách bảo mật, vui lòng liên hệ:
          </p>

          <p className="text-gray-700 mt-3">📍 Địa chỉ: TP. Hồ Chí Minh</p>
          <p className="text-gray-700">📞 Hotline: 0123 456 789</p>
          <p className="text-gray-700">📧 Email: support@coffeeshop.vn</p>

          <p className="mt-4 font-medium">
            Coffee Shop cam kết bảo vệ thông tin khách hàng một cách an toàn và
            minh bạch.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default PrivacyPolicy;
